import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { favoriteApiService } from '../../../../../services/index.ts';
import { CallbackDataSerializer } from '../../../../config/callback/CallbackDataSerializer.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { useAnalytics } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

/**
 * Comando para listar corridas favoritas do usuário
 */
export async function listFavoriteRacesCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    const telegramId = input.user?.id?.toString();

    if (!telegramId) {
      return {
        text: '❌ ID do usuário não encontrado.',
        format: 'HTML',
      };
    }

    logger.info('Listing user favorite races', {
      module: 'listFavoriteRacesCommand',
      action: 'list_favorite_races',
      userId: telegramId,
    });

    const favoriteRaces =
      await favoriteApiService.getUserFavoriteRaces(telegramId);

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
      analytics
        .trackEvent({
          action: 'COMMAND',
          targetType: 'FAVORITES_LIST',
          targetId: 'favorites_command',
          props: {
            command: '/favoritas',
            favorites_count: String(favoriteRaces.length),
            has_favorites: favoriteRaces.length > 0 ? 'true' : 'false',
          },
        })
        .catch(error => {
          logger.error(
            'Analytics tracking failed for favorites command (non-blocking)',
            {
              module: 'listFavoriteRacesCommand',
              userId: telegramId,
              favoritesCount: favoriteRaces.length,
            },
            error as Error
          );
        });
    }

    if (favoriteRaces.length === 0) {
      return {
        text: '📝 <b>Suas Corridas Favoritas</b>\\n\\n❌ Você ainda não tem corridas favoritas!\\n\\n💡 Para favoritar uma corrida, use o comando /corridas e clique no botão ❤️ de uma corrida.',
        format: 'HTML',
        keyboard: {
          buttons: [
            [
              {
                text: '🏃‍♂️ Ver Todas as Corridas',
                callbackData: CallbackDataSerializer.racesList(),
              },
            ],
          ],
          inline: true,
        },
      };
    }

    const raceButtons = favoriteRaces.slice(0, 10).map(race => [
      {
        text: `🏃‍♂️ ${race.title} - ${race.distances.join('/')}`,
        callbackData: CallbackDataSerializer.raceDetails(race.id),
      },
    ]);

    const navigationButtons = [
      [
        {
          text: '🏃‍♂️ Ver Todas as Corridas',
          callbackData: CallbackDataSerializer.racesList(),
        },
      ],
    ];

    logger.info('Successfully listed favorite races', {
      module: 'listFavoriteRacesCommand',
      userId: telegramId,
      count: favoriteRaces.length,
    });

    return {
      text: `⭐ <strong>Suas Corridas Favoritas</strong> (${favoriteRaces.length})\\n\\nSelecione uma corrida para ver mais detalhes:`,
      format: 'HTML',
      keyboard: {
        buttons: [...raceButtons, ...navigationButtons],
        inline: true,
      },
    };
  } catch (error) {
    logger.error(
      'Error in listFavoriteRacesCommand',
      {
        module: 'listFavoriteRacesCommand',
        action: 'list_favorite_races',
        userId: input.user?.id?.toString(),
      },
      error as Error
    );

    return {
      text: '❌ Erro ao buscar corridas favoritas. Tente novamente mais tarde.',
      format: 'HTML',
    };
  }
}
