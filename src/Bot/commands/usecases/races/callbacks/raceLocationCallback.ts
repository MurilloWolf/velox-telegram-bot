import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceLocationCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { raceLocationView } from '../../../../presentation/views/races/raceLocationView.ts';
import { logger } from '../../../../../utils/Logger.ts';

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
