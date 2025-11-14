import { httpClient, ApiError } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';
import { Race } from '../types/Service.ts';

export class RaceApiService {
  private readonly baseUrl = '/races';

  async getAvailableRaces(): Promise<Race[]> {
    try {
      const response = await httpClient.get<Race[]>(
        `${this.baseUrl}/available`
      );

      logger.info('Successfully retrieved available races', {
        module: 'RaceApiService',
        action: 'get_available_races',
        racesCount: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error getting available races',
        {
          module: 'RaceApiService',
          action: 'get_available_races',
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
