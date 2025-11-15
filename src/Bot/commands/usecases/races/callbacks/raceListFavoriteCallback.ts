import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import { CallbackData } from '../../../../../types/callbacks/index.ts';
import { favoriteApiService } from '../../../../../services/index.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { useAnalytics } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';
import { raceFavoritesView } from '../../../../presentation/views/races/raceFavoritesView.ts';

/**
 * Handler para listar corridas favoritas via callback
 */
export class RaceListFavoriteCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'races_list_favorite';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const telegramId = input.user?.id?.toString();

      if (!telegramId) {
        return {
          text: '❌ ID do usuário não encontrado.',
          format: 'HTML',
          editMessage: true,
        };
      }

      logger.info('Fetching user favorite races', {
        module: 'RaceListFavoriteCallbackHandler',
        action: 'get_favorite_races',
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
            action: 'VIEW',
            targetType: 'FAVORITES_LIST',
            targetId: 'favorites_list',
            props: {
              favorites_count: String(favoriteRaces.length),
              has_favorites: favoriteRaces.length > 0 ? 'true' : 'false',
            },
          })
          .catch(error => {
            logger.error(
              'Analytics tracking failed for favorites list view (non-blocking)',
              {
                module: 'RaceListFavoriteCallbackHandler',
                userId: telegramId,
                favoritesCount: favoriteRaces.length,
              },
              error as Error
            );
          });
      }

      logger.info('Successfully listed favorite races', {
        module: 'RaceListFavoriteCallbackHandler',
        userId: telegramId,
        count: favoriteRaces.length,
      });

      return raceFavoritesView.createFavoritesListView(favoriteRaces);
    } catch (error) {
      logger.error(
        'Error in RaceListFavoriteCallbackHandler',
        {
          module: 'RaceListFavoriteCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return raceFavoritesView.createErrorView();
    }
  }
}

export const raceListFavoriteCallbackHandler =
  new RaceListFavoriteCallbackHandler();
