import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceListCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/index.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { raceGeneralListView } from '../../../../presentation/views/races/raceGeneralListView.ts';

/**
 * Handler para listar corridas com filtros opcionais
 */
export class RaceListCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'races_list';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as RaceListCallbackData;

      logger.info('Listing races', {
        module: 'RaceListCallbackHandler',
        action: 'list_races',
        distance: data.distance,
        userId: input.user?.id?.toString(),
      });

      let races;

      if (data.distance) {
        const allRaces = await raceApiService.getAvailableRaces();
        races = allRaces.filter(
          race =>
            race.distancesNumbers &&
            race.distancesNumbers.includes(data.distance!)
        );
      } else {
        races = await raceApiService.getAvailableRaces();
      }

      return raceGeneralListView.createGeneralRaceListView(
        races,
        data.distance
      );
    } catch (error) {
      logger.error(
        'Error in RaceListCallbackHandler',
        {
          module: 'RaceListCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return raceGeneralListView.createErrorView();
    }
  }
}

export const raceListCallbackHandler = new RaceListCallbackHandler();
