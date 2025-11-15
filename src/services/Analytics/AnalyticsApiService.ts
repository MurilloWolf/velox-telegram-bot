import { httpClient, ApiError } from '../http/HttpClient.ts';
import { logger } from '../../utils/Logger.ts';
import { TrackingEvent } from '../../types/Analytics.ts';

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  eventId?: string;
}

export class AnalyticsApiService {
  private readonly baseEndpoint = '/analytics/events';

  async trackEvent(event: TrackingEvent): Promise<AnalyticsResponse> {
    try {
      logger.info('Tracking event', {
        module: 'AnalyticsApiService',
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        channel: event.channel,
      });

      const response = await httpClient.post<AnalyticsResponse>(
        this.baseEndpoint,
        event
      );

      logger.debug('Analytics tracking success', {
        module: 'AnalyticsApiService',
        response: response.data,
      });

      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('Analytics API Error', {
          module: 'AnalyticsApiService',
          status: error.status,
          message: error.message,
          event,
        });
        throw error;
      }

      logger.error(
        'Analytics tracking error',
        {
          module: 'AnalyticsApiService',
          event,
        },
        error as Error
      );

      throw new ApiError('Failed to track analytics event', undefined, error);
    }
  }
}

export const analyticsApiService = new AnalyticsApiService();
