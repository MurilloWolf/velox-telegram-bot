import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceFavoriteCallbackData,
  RaceUnfavoriteCallbackData,
} from '../../../../../types/callbacks/index.ts';
import {
  favoriteApiService,
  raceApiService,
} from '../../../../../services/index.ts';
import { raceDetailView } from '../../../../presentation/views/races/raceDetailView.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { useAnalytics } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

/**
 * Handler para favoritar uma corrida
 */
export class RaceFavoriteCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'race_favorite';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as RaceFavoriteCallbackData;
      const telegramId = input.user?.id?.toString();

      if (!telegramId) {
        return {
          text: '❌ ID do usuário não encontrado.',
          format: 'HTML',
          editMessage: true,
        };
      }

      logger.info('Adding race to favorites', {
        module: 'RaceFavoriteCallbackHandler',
        action: 'add_favorite_race',
        raceId: data.raceId,
        userId: telegramId,
      });

      // Usar toggleFavoriteRace ao invés de addFavoriteRace para uma experiência melhor
      const result = await favoriteApiService.toggleFavoriteRace(
        telegramId,
        data.raceId
      );

      // Buscar dados da corrida para retornar à view de detalhes
      const race = await raceApiService.getRaceById(data.raceId);

      if (!race) {
        return {
          text: '❌ Corrida não encontrada.',
          format: 'HTML',
          editMessage: true,
        };
      }

      // Determinar se agora está favoritado ou não
      const isFavorited = result.action === 'added';

      logger.info('Race favorite status toggled', {
        module: 'RaceFavoriteCallbackHandler',
        raceId: data.raceId,
        userId: telegramId,
        action: result.action,
        isFavorited,
      });

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
          .trackRaceFavoriteAction(
            isFavorited ? 'FAVORITE_ADD' : 'FAVORITE_REMOVE',
            data.raceId,
            race.title,
            race.distances,
            race.city
          )
          .catch(error => {
            logger.error(
              'Analytics tracking failed for favorite action (non-blocking)',
              {
                module: 'RaceFavoriteCallbackHandler',
                raceId: data.raceId,
                userId: telegramId,
                action: result.action,
              },
              error as Error
            );
          });
      }

      // Retornar à view de detalhes com status atualizado
      return raceDetailView.createRaceDetailView(race, undefined, isFavorited);
    } catch (error) {
      logger.error(
        'Error in RaceFavoriteCallbackHandler',
        {
          module: 'RaceFavoriteCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return {
        text: '❌ Erro ao favoritar corrida. Tente novamente.',
        format: 'HTML',
        editMessage: true,
      };
    }
  }
}

/**
 * Handler para desfavoritar uma corrida
 */
export class RaceUnfavoriteCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'race_unfavorite';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as RaceUnfavoriteCallbackData;
      const telegramId = input.user?.id?.toString();

      if (!telegramId) {
        return {
          text: '❌ ID do usuário não encontrado.',
          format: 'HTML',
          editMessage: true,
        };
      }

      logger.info('Removing race from favorites', {
        module: 'RaceUnfavoriteCallbackHandler',
        action: 'remove_favorite_race',
        raceId: data.raceId,
        userId: telegramId,
      });

      // Usar toggleFavoriteRace ao invés de removeFavoriteRace para uma experiência melhor
      const result = await favoriteApiService.toggleFavoriteRace(
        telegramId,
        data.raceId
      );

      // Buscar dados da corrida para retornar à view de detalhes
      const race = await raceApiService.getRaceById(data.raceId);

      if (!race) {
        return {
          text: '❌ Corrida não encontrada.',
          format: 'HTML',
          editMessage: true,
        };
      }

      // Determinar se agora está favoritado ou não
      const isFavorited = result.action === 'added';

      logger.info('Race favorite status toggled', {
        module: 'RaceUnfavoriteCallbackHandler',
        raceId: data.raceId,
        userId: telegramId,
        action: result.action,
        isFavorited,
      });

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
          .trackRaceFavoriteAction(
            isFavorited ? 'FAVORITE_ADD' : 'FAVORITE_REMOVE',
            data.raceId,
            race.title,
            race.distances,
            race.city
          )
          .catch(error => {
            logger.error(
              'Analytics tracking failed for unfavorite action (non-blocking)',
              {
                module: 'RaceUnfavoriteCallbackHandler',
                raceId: data.raceId,
                userId: telegramId,
                action: result.action,
              },
              error as Error
            );
          });
      }

      // Retornar à view de detalhes com status atualizado
      return raceDetailView.createRaceDetailView(race, undefined, isFavorited);
    } catch (error) {
      logger.error(
        'Error in RaceUnfavoriteCallbackHandler',
        {
          module: 'RaceUnfavoriteCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return {
        text: '❌ Erro ao remover corrida dos favoritos. Tente novamente.',
        format: 'HTML',
        editMessage: true,
      };
    }
  }
}

export const raceFavoriteCallbackHandler = new RaceFavoriteCallbackHandler();
export const raceUnfavoriteCallbackHandler =
  new RaceUnfavoriteCallbackHandler();
