import { useAnalytics } from './AnalyticsHelpers.ts';
import { TelegramContext } from '../types/Analytics.ts';
import { logger } from './Logger.ts';

export interface UrlTrackingConfig {
  raceId: string;
  raceName?: string;
  registrationLink: string;
  provider?: string;
}

export class UrlTracker {
  static async trackRegistrationClick(
    config: UrlTrackingConfig,
    telegramContext: TelegramContext
  ): Promise<void> {
    try {
      const analytics = useAnalytics(telegramContext);

      await analytics.trackRaceRegistrationClick(
        config.raceId,
        config.raceName,
        config.registrationLink,
        config.provider || 'external'
      );

      logger.info('Registration click tracked', {
        module: 'UrlTracker',
        raceId: config.raceId,
        userId: String(telegramContext.userId),
      });
    } catch (error) {
      logger.error(
        'Failed to track registration click',
        {
          module: 'UrlTracker',
          raceId: config.raceId,
          userId: String(telegramContext.userId),
        },
        error as Error
      );
    }
  }
}

export const urlTracker = new UrlTracker();
