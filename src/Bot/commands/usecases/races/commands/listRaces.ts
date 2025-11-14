import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { raceListView } from '../../../../presentation/views/races/raceListView.ts';

export async function listRacesCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    // Se há callback data, significa que o usuário selecionou um UF
    if (input.callbackData && input.callbackData.type === 'uf_filter') {
      const { uf } = input.callbackData;

      logger.info('Fetching races for UF filter', {
        module: 'listRacesCommand',
        action: 'fetch_races_with_filter',
        uf,
        userId: input.user?.id?.toString(),
      });

      const races = await raceApiService.getAvailableRaces({ uf });
      return raceListView.createRaceListView(races, uf, true);
    }

    logger.info('Showing UF filter options for list races', {
      module: 'listRacesCommand',
      action: 'show_filter_options',
      userId: input.user?.id?.toString(),
    });

    return raceListView.createUfFilterView();
  } catch (error) {
    logger.error(
      'Error in listRacesCommand',
      {
        module: 'listRacesCommand',
        action: 'command_execution',
        userId: input.user?.id?.toString(),
        callbackType: input.callbackData?.type,
      },
      error as Error
    );

    return raceListView.createErrorView(!!input.callbackData);
  }
}
