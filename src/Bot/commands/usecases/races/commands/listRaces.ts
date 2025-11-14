import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { RaceFormatter } from '../../../../../utils/formatters/RaceFormatter.ts';
import { CallbackDataSerializer } from '../../../../config/callback/CallbackDataSerializer.ts';
import { logger } from '../../../../../utils/Logger.ts';

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
      if (races.length === 0) {
        return {
          text: `❌ Nenhuma corrida encontrada no estado de ${uf === 'SP' ? 'São Paulo' : 'Paraná'}.`,
          format: 'HTML',
          editMessage: true,
        };
      }

      const raceListText = RaceFormatter.formatRaceList(races);
      const ufFullName = uf === 'SP' ? 'São Paulo' : 'Paraná';
      return {
        text: `🗺️ <strong>Corridas em ${ufFullName}</strong>\n\n${raceListText}`,
        format: 'HTML',
        editMessage: true,
      };
    }

    // Primeira execução - mostrar opções de filtro
    logger.info('Showing UF filter options for list races', {
      module: 'listRacesCommand',
      action: 'show_filter_options',
      userId: input.user?.id?.toString(),
    });

    return {
      text: `🏃‍♂️ <strong>Lista de Corridas</strong>

Escolha o estado para ver as corridas disponíveis:`,
      format: 'HTML',
      keyboard: {
        inline: true,
        buttons: [
          [
            {
              text: '🌆 São Paulo (SP)',
              callbackData: CallbackDataSerializer.ufFilter('SP'),
            },
            {
              text: '🌲 Paraná (PR)',
              callbackData: CallbackDataSerializer.ufFilter('PR'),
            },
          ],
        ],
      },
    };
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

    return {
      text: '❌ Erro ao buscar corridas. Tente novamente mais tarde.',
      format: 'HTML',
      editMessage: !!input.callbackData,
    };
  }
}
