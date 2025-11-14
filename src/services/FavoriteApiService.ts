/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';

export interface FavoriteRace {
  id: string;
  title: string;
  organization: string;
  distances: string[];
  distancesNumbers: number[];
  date: string;
  location: string;
  link: string;
  time: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToggleFavoriteData {
  action: 'added' | 'removed';
  favorite?: FavoriteRace;
}

export interface RaceFavoriteStatusData {
  raceId: string;
  isFavorited: boolean;
}

export class FavoriteApiService {
  private readonly baseUrl = '/favorites';

  async addFavoriteRace(
    telegramId: string,
    raceId: string
  ): Promise<FavoriteRace> {
    try {
      const response = await httpClient.post<FavoriteRace>(
        `${this.baseUrl}/${telegramId}/${raceId}`
      );

      logger.info('Successfully added race to favorites', {
        module: 'FavoriteApiService',
        action: 'add_favorite_race',
        telegramId,
        raceId,
      });

      return response.data;
    } catch (error: unknown) {
      logger.error(
        'Error adding race to favorites',
        {
          module: 'FavoriteApiService',
          action: 'add_favorite_race',
          telegramId,
          raceId,
        },
        error as Error
      );

      const axiosError = error as any;
      const status = axiosError.response?.status;

      switch (status) {
        case 400:
          throw new Error(
            'Dados inválidos para adicionar corrida aos favoritos'
          );
        case 404:
          throw new Error('Corrida não encontrada');
        case 409:
          throw new Error('Corrida já está nos favoritos');
        default:
          throw new Error('Erro interno do servidor');
      }
    }
  }

  async getUserFavoriteRaces(telegramId: string): Promise<FavoriteRace[]> {
    try {
      const response = await httpClient.get<FavoriteRace[]>(
        `${this.baseUrl}/${telegramId}`
      );

      logger.info('Successfully retrieved user favorite races', {
        module: 'FavoriteApiService',
        action: 'get_user_favorite_races',
        telegramId,
        count: response.data.length,
      });

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as any;

      // Handle 404 specially for getUserFavoriteRaces - return empty array
      if (axiosError.response?.status === 404) {
        return [];
      }

      logger.error(
        'Error getting user favorite races',
        {
          module: 'FavoriteApiService',
          action: 'get_user_favorite_races',
          telegramId,
        },
        error as Error
      );

      const status = axiosError.response?.status;
      switch (status) {
        case 400:
          throw new Error('Dados inválidos para buscar favoritos');
        case 403:
          throw new Error('Acesso negado aos favoritos');
        default:
          throw new Error('Erro interno do servidor');
      }
    }
  }

  async removeFavoriteRace(telegramId: string, raceId: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${telegramId}/${raceId}`);

      logger.info('Successfully removed race from favorites', {
        module: 'FavoriteApiService',
        action: 'remove_favorite_race',
        telegramId,
        raceId,
      });
    } catch (error: unknown) {
      logger.error(
        'Error removing race from favorites',
        {
          module: 'FavoriteApiService',
          action: 'remove_favorite_race',
          telegramId,
          raceId,
        },
        error as Error
      );

      const axiosError = error as any;
      const status = axiosError.response?.status;

      switch (status) {
        case 400:
          throw new Error('Dados inválidos para remover corrida dos favoritos');
        case 404:
          throw new Error('Favorito não encontrado');
        case 403:
          throw new Error('Acesso negado para remover favorito');
        default:
          throw new Error('Erro interno do servidor');
      }
    }
  }

  async toggleFavoriteRace(
    telegramId: string,
    raceId: string
  ): Promise<ToggleFavoriteData> {
    try {
      const response = await httpClient.put<ToggleFavoriteData>(
        `${this.baseUrl}/${telegramId}/${raceId}/toggle`
      );

      logger.info('Successfully toggled race favorite status', {
        module: 'FavoriteApiService',
        action: 'toggle_favorite_race',
        telegramId,
        raceId,
        toggleAction: response.data.action,
      });

      return response.data;
    } catch (error: unknown) {
      logger.error(
        'Error toggling race favorite status',
        {
          module: 'FavoriteApiService',
          action: 'toggle_favorite_race',
          telegramId,
          raceId,
        },
        error as Error
      );

      const axiosError = error as any;
      const status = axiosError.response?.status;

      switch (status) {
        case 400:
          throw new Error('Dados inválidos para alterar status do favorito');
        case 404:
          throw new Error('Corrida não encontrada');
        case 403:
          throw new Error('Acesso negado para alterar favorito');
        default:
          throw new Error('Erro interno do servidor');
      }
    }
  }

  async isRaceFavorited(telegramId: string, raceId: string): Promise<boolean> {
    try {
      const response = await httpClient.get<RaceFavoriteStatusData>(
        `${this.baseUrl}/${telegramId}/${raceId}/status`
      );

      logger.info('Successfully checked race favorite status', {
        module: 'FavoriteApiService',
        action: 'is_race_favorited',
        telegramId,
        raceId,
        isFavorited: response.data.isFavorited,
      });

      return response.data.isFavorited;
    } catch (error: unknown) {
      logger.error(
        'Error checking race favorite status',
        {
          module: 'FavoriteApiService',
          action: 'is_race_favorited',
          telegramId,
          raceId,
        },
        error as Error
      );

      const axiosError = error as any;
      const status = axiosError.response?.status;

      switch (status) {
        case 400:
          throw new Error('Dados inválidos para verificar status do favorito');
        case 404:
          // Para verificação de status, 404 pode significar que não é favorito
          return false;
        case 403:
          throw new Error('Acesso negado para verificar favorito');
        default:
          throw new Error('Erro interno do servidor');
      }
    }
  }
}

export const favoriteApiService = new FavoriteApiService();
