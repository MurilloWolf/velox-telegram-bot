import { httpClient } from '../http/HttpClient.ts';
import { logger } from '../../utils/Logger.ts';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services?: {
    database?: 'up' | 'down';
    api?: 'up' | 'down';
  };
}

export class HealthApiService {
  private readonly baseUrl = '/health';

  async healthCheck(): Promise<boolean> {
    try {
      const response = await httpClient.get(this.baseUrl);
      return response.status === 200;
    } catch (error) {
      logger.error(
        'Health check failed',
        {
          module: 'HealthApiService',
          action: 'health_check',
        },
        error as Error
      );
      return false;
    }
  }

  async getDetailedHealth(): Promise<HealthStatus | null> {
    try {
      const response = await httpClient.get<HealthStatus>(
        `${this.baseUrl}/detailed`
      );
      return response.data;
    } catch (error) {
      logger.error(
        'Detailed health check failed',
        {
          module: 'HealthApiService',
          action: 'get_detailed_health',
        },
        error as Error
      );
      return null;
    }
  }
}

// Singleton instance
export const healthApiService = new HealthApiService();
