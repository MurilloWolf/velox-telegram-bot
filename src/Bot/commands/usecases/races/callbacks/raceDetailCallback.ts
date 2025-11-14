import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceDetailCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { raceDetailView } from '../../../../presentation/views/races/raceDetailView.ts';
import { logger } from '../../../../../utils/Logger.ts';

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
