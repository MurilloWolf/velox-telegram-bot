import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceLocationCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { raceLocationView } from '../../../../presentation/views/races/raceLocationView.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { quickTrackRaceLocationClick } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

export class RaceLocationCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'race_location';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const callbackData = input.callbackData as RaceLocationCallbackData;
      const { raceId, uf } = callbackData;

      logger.info('Showing race location', {
        module: 'RaceLocationCallbackHandler',
        action: 'show_race_location',
        raceId,
        userId: input.user?.id?.toString(),
      });

      const race = await raceApiService.getRaceById(raceId);

      if (!race) {
        return raceLocationView.createRaceNotFoundView();
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

          await quickTrackRaceLocationClick(
            race.id,
            telegramContext,
            race.location
          );
        } catch (trackingError) {
          logger.error(
            'Failed to track race location click',
            {
              module: 'RaceLocationCallbackHandler',
              raceId: race.id,
              userId: String(input.user.id),
            },
            trackingError as Error
          );
        }
      }

      return raceLocationView.createRaceLocationView(race, uf);
    } catch (error) {
      logger.error(
        'Error in RaceLocationCallbackHandler',
        {
          module: 'RaceLocationCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return raceLocationView.createErrorView();
    }
  }
}

export const raceLocationCallbackHandler = new RaceLocationCallbackHandler();
