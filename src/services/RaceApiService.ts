import { httpClient, ApiError } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';
import { Race } from '../types/Service.ts';

export class RaceApiService {
  private readonly baseUrl = '/races';

  async getAvailableRaces(filters?: { uf?: string }): Promise<Race[]> {
    try {
      let url = `${this.baseUrl}/available`;
      if (filters?.uf) {
        url += `?uf=${filters.uf}`;
      }

      const response = await httpClient.get<Race[]>(url);

      logger.info('Successfully retrieved available races', {
        module: 'RaceApiService',
        action: 'get_available_races',
        racesCount: response.data.length,
        filters,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error getting available races',
        {
          module: 'RaceApiService',
          action: 'get_available_races',
          filters,
        },
        error as Error
      );
      throw error;
    }
  }

  async getRacesByUf(uf: string): Promise<Race[]> {
    try {
      const response = await httpClient.get<Race[]>(
        `${this.baseUrl}/available?uf=${uf}`
      );

      logger.info('Successfully retrieved races by UF', {
        module: 'RaceApiService',
        action: 'get_races_by_uf',
        uf,
        racesCount: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error getting races by UF',
        {
          module: 'RaceApiService',
          action: 'get_races_by_uf',
          uf,
        },
        error as Error
      );
      throw error;
    }
  }

  async getRacesByUfAndDistance(
    uf: string,
    distanceRange: { min: number; max: number }
  ): Promise<Race[]> {
    try {
      const url = `${this.baseUrl}/available?uf=${uf}&minDistance=${distanceRange.min}&maxDistance=${distanceRange.max}`;
      const response = await httpClient.get<Race[]>(url);

      logger.info('Successfully retrieved races by UF and distance', {
        module: 'RaceApiService',
        action: 'get_races_by_uf_and_distance',
        uf,
        distanceRange,
        racesCount: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error getting races by UF and distance',
        {
          module: 'RaceApiService',
          action: 'get_races_by_uf_and_distance',
          uf,
          distanceRange,
        },
        error as Error
      );
      throw error;
    }
  }

  async getRaceById(id: string): Promise<Race | null> {
    try {
      const response = await httpClient.get<Race>(`${this.baseUrl}/${id}`);
      logger.info('Successfully retrieved race by ID', {
        module: 'RaceApiService',
        action: 'get_race_by_id',
        raceId: id,
        raceTitle: response.data.title,
      });

      return response.data;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      logger.error(
        'Error getting race by ID',
        {
          module: 'RaceApiService',
          action: 'get_race_by_id',
          raceId: id,
        },
        error as Error
      );
      throw error;
    }
  }
}

export const raceApiService = new RaceApiService();
