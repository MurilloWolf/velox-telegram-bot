import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  DistanceFilterCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/index.ts';
import { distanceFilterView } from '../../../../presentation/views/races/distanceFilterView.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { useAnalytics } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

export class DistanceFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'distance_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as DistanceFilterCallbackData;
      const { uf, distance } = data;

      logger.info(`Filtering races by distance: ${distance} for UF: ${uf}`, {
        module: 'DistanceFilterCallbackHandler',
        action: 'handle',
        uf,
        distance,
        userId: input.user?.id?.toString(),
      });

      // Track analytics (non-blocking)
      if (input.user?.id) {
        const telegramContext: TelegramContext = {
          userId:
            typeof input.user.id === 'number'
              ? input.user.id
              : parseInt(String(input.user.id)),
          chatId: 0, // Chat ID not available in this context
          messageId:
            typeof input.messageId === 'number' ? input.messageId : undefined,
          username: input.user.name,
        };

        const analytics = useAnalytics(telegramContext);
        // Fire and forget - don't await to prevent blocking on analytics errors
        analytics
          .trackFilterChange('distance', distance, {
            active: 'true',
            uf: uf,
          })
          .catch(error => {
            logger.error(
              'Analytics tracking failed (non-blocking)',
              {
                module: 'DistanceFilterCallbackHandler',
                distance,
                uf,
                userId: input.user?.id ? String(input.user.id) : 'unknown',
              },
              error as Error
            );
          });
      }

      // Get races from API
      const races = await raceApiService.getRacesByUf(uf);

      let filteredRaces = races;

      // Apply distance filter if not ALL
      if (distance !== 'ALL') {
        const distanceRange = this.mapDistanceToRange(distance);

        filteredRaces = races.filter(race => {
          if (!race.distancesNumbers || !Array.isArray(race.distancesNumbers)) {
            return false;
          }

          return race.distancesNumbers.some(
            d => d >= distanceRange.min && d <= distanceRange.max
          );
        });
      }

      if (!filteredRaces || filteredRaces.length === 0) {
        return distanceFilterView.createNoRacesFoundView(uf, distance);
      }

      return distanceFilterView.createFilteredRacesView(
        filteredRaces,
        uf,
        distance
      );
    } catch (error) {
      logger.error('Failed to filter races by distance', {
        module: 'DistanceFilterCallbackHandler',
        action: 'handle',
        error: String(error),
        userId: input.user?.id?.toString(),
      });

      return distanceFilterView.createErrorView();
    }
  }

  private mapDistanceToRange(distance: string): { min: number; max: number } {
    switch (distance) {
      case '5K-9K':
        return { min: 5, max: 9 };
      case '10K-21K':
        return { min: 10, max: 21 };
      case '42K':
        return { min: 42, max: 42 };
      default:
        return { min: 0, max: 999 }; // ALL distances
    }
  }
}

export const distanceFilterCallbackHandler =
  new DistanceFilterCallbackHandler();
