import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceFilterCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/index.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { raceGeneralListView } from '../../../../presentation/views/races/raceGeneralListView.ts';

/**
 * Handler para filtrar corridas por distância
 */
export class RaceFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'races_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as RaceFilterCallbackData;

      logger.info('Filtering races by distance', {
        module: 'RaceFilterCallbackHandler',
        action: 'filter_races',
        distance: data.distance,
        userId: input.user?.id?.toString(),
      });

      // Buscar todas as corridas e filtrar por distância
      const allRaces = await raceApiService.getAvailableRaces();
      const races = allRaces.filter(
        race =>
          race.distancesNumbers && race.distancesNumbers.includes(data.distance)
      );

      return raceGeneralListView.createFilteredRaceListView(
        races,
        data.distance
      );
    } catch (error) {
      logger.error(
        'Error in RaceFilterCallbackHandler',
        {
          module: 'RaceFilterCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return raceGeneralListView.createErrorView();
    }
  }
}

export const raceFilterCallbackHandler = new RaceFilterCallbackHandler();
