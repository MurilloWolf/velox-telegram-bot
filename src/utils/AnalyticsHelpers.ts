import { analyticsApiService } from '../services/Analytics/AnalyticsApiService.ts';
import {
  TrackingEvent,
  TrackingProps,
  TelegramContext,
} from '../types/Analytics.ts';
import { logger } from './Logger.ts';

export interface AnalyticsHelpers {
  trackRaceView: (
    raceSlug: string,
    raceName?: string,
    distance?: string | string[] | number[],
    city?: string,
    props?: TrackingProps
  ) => Promise<void>;
  trackRaceLocationClick: (
    raceSlug: string,
    locationName?: string,
    props?: TrackingProps
  ) => Promise<void>;
  trackRaceRegistrationClick: (
    raceSlug: string,
    raceName?: string,
    registrationLink?: string,
    provider?: string,
    props?: TrackingProps
  ) => Promise<void>;
  trackFilterChange: (
    filterName: string,
    filterValue: string | number,
    props?: TrackingProps
  ) => Promise<void>;
  trackEvent: (
    event: Omit<TrackingEvent, 'channel' | 'sessionId' | 'deviceId'>
  ) => Promise<void>;
}

export function useAnalytics(
  telegramContext: TelegramContext
): AnalyticsHelpers {
  const sessionId = generateSessionId(telegramContext);

  const trackEvent = async (
    event: Omit<TrackingEvent, 'channel' | 'sessionId' | 'deviceId'>
  ): Promise<void> => {
    try {
      // Normalize props to only contain strings
      const normalizedProps: Record<string, string> = {};
      if (event.props) {
        Object.entries(event.props).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            normalizedProps[key] = String(value);
          }
        });
      }

      const deviceId = generateDeviceId(telegramContext);

      const trackingEvent: TrackingEvent = {
        ...event,
        channel: 'TELEGRAM',
        sessionId,
        deviceId,
        userAgent: 'Telegram Bot',
        isMobile: true,
        props:
          Object.keys(normalizedProps).length > 0 ? normalizedProps : undefined,
      };

      await analyticsApiService.trackEvent(trackingEvent);
    } catch (error) {
      logger.error(
        'Failed to track event',
        {
          module: 'useAnalytics',
          event,
          telegramContext,
        },
        error as Error
      );
    }
  };

  const trackRaceView = async (
    raceSlug: string,
    raceName?: string,
    distance?: string | string[] | number[],
    city?: string,
    props?: TrackingProps
  ): Promise<void> => {
    // Convert distance to string format
    let distanceStr: string | undefined;
    if (distance) {
      if (Array.isArray(distance)) {
        distanceStr = distance.join(', ');
      } else {
        distanceStr = String(distance);
      }
    }

    const eventProps: Record<string, string> = {};
    if (raceName) {
      eventProps.race_name = raceName;
    }
    if (distanceStr) {
      eventProps.distance = distanceStr;
    }
    if (city) {
      eventProps.city = city;
    }
    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          eventProps[key] = value;
        }
      });
    }

    await trackEvent({
      action: 'VIEW',
      targetType: 'RACE_EVENT',
      targetId: `race:${raceSlug}`,
      props: Object.keys(eventProps).length > 0 ? eventProps : undefined,
    });
  };

  const trackRaceLocationClick = async (
    raceSlug: string,
    locationName?: string,
    props?: TrackingProps
  ): Promise<void> => {
    const eventProps: Record<string, string> = {};
    if (locationName) {
      eventProps.location_name = locationName;
    }
    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          eventProps[key] = value;
        }
      });
    }

    await trackEvent({
      action: 'CLICK',
      targetType: 'RACE_LOCATION',
      targetId: `race:${raceSlug}`,
      props: Object.keys(eventProps).length > 0 ? eventProps : undefined,
    });
  };

  const trackRaceRegistrationClick = async (
    raceSlug: string,
    raceName?: string,
    registrationLink?: string,
    provider?: string,
    props?: TrackingProps
  ): Promise<void> => {
    const eventProps: Record<string, string> = {};
    if (raceName) {
      eventProps.race_name = raceName;
    }
    if (registrationLink) {
      eventProps.registration_link = registrationLink;
    }
    if (provider) {
      eventProps.provider = provider;
    }
    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          eventProps[key] = value;
        }
      });
    }

    await trackEvent({
      action: 'CLICK',
      targetType: 'RACE_REGISTRATION',
      targetId: `race:${raceSlug}`,
      props: Object.keys(eventProps).length > 0 ? eventProps : undefined,
    });
  };

  const trackFilterChange = async (
    filterName: string,
    filterValue: string | number,
    props?: TrackingProps
  ): Promise<void> => {
    await trackEvent({
      action: 'FILTER',
      targetType: 'FILTER',
      targetId: `filter:${filterName}`,
      props: {
        filter_name: filterName,
        filter_value: String(filterValue),
        ...props,
      },
    });
  };

  return {
    trackRaceView,
    trackRaceLocationClick,
    trackRaceRegistrationClick,
    trackFilterChange,
    trackEvent,
  };
}

function generateSessionId(telegramContext: TelegramContext): string {
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 30)); // 30-minute sessions
  return `telegram_${telegramContext.userId}_${telegramContext.chatId}_${timestamp}`;
}

function generateDeviceId(telegramContext: TelegramContext): string {
  // Generate a stable device ID based on user context
  return `telegram_device_${telegramContext.userId}`;
}

export async function quickTrackRaceView(
  raceSlug: string,
  telegramContext: TelegramContext,
  raceName?: string,
  distance?: string | string[] | number[],
  city?: string
): Promise<void> {
  const analytics = useAnalytics(telegramContext);
  await analytics.trackRaceView(raceSlug, raceName, distance, city);
}

export async function quickTrackRaceRegistrationClick(
  raceSlug: string,
  telegramContext: TelegramContext,
  raceName?: string,
  registrationLink?: string,
  provider?: string
): Promise<void> {
  const analytics = useAnalytics(telegramContext);
  await analytics.trackRaceRegistrationClick(
    raceSlug,
    raceName,
    registrationLink,
    provider
  );
}

export async function quickTrackRaceLocationClick(
  raceSlug: string,
  telegramContext: TelegramContext,
  locationName?: string
): Promise<void> {
  const analytics = useAnalytics(telegramContext);
  await analytics.trackRaceLocationClick(raceSlug, locationName);
}
