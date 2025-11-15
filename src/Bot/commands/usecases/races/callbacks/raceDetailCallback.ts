import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceDetailCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { raceDetailView } from '../../../../presentation/views/races/raceDetailView.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { quickTrackRaceView } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

export class RaceDetailCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'race_detail';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const callbackData = input.callbackData as RaceDetailCallbackData;
      const { raceId, uf } = callbackData;

      logger.info('Fetching race details', {
        module: 'RaceDetailCallbackHandler',
        action: 'fetch_race_details',
        raceId,
        userId: input.user?.id?.toString(),
      });

      const race = await raceApiService.getRaceById(raceId);

      if (!race) {
        return raceDetailView.createRaceNotFoundView();
      }

      if (input.user?.id) {
        try {
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

          await quickTrackRaceView(
            race.id,
            telegramContext,
            race.title,
            race.distances,
            race.city
          );
        } catch (trackingError) {
          logger.error(
            'Failed to track race view',
            {
              module: 'RaceDetailCallbackHandler',
              raceId: race.id,
              userId: String(input.user.id),
            },
            trackingError as Error
          );
        }
      }

      return raceDetailView.createRaceDetailView(race, uf);
    } catch (error) {
      logger.error(
        'Error in RaceDetailCallbackHandler',
        {
          module: 'RaceDetailCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return raceDetailView.createErrorView();
    }
  }
}

export const raceDetailCallbackHandler = new RaceDetailCallbackHandler();
