export interface TrackingEvent {
  action: string;
  targetType: string;
  targetId?: string;
  channel: Channel;
  userAgent?: string;
  isMobile?: boolean;
  purchaseId?: string;
  pagePath?: string;
  referrer?: string;
  props?: Record<string, string>;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceId?: string;
}

export type TrackingAction =
  | 'VIEW'
  | 'CLICK'
  | 'SUBMIT'
  | 'FILTER'
  | 'OPEN'
  | 'CLOSE'
  | 'PURCHASE';

export type TargetType =
  | 'PAGE'
  | 'SECTION'
  | 'BUTTON'
  | 'LINK'
  | 'FILTER'
  | 'MODAL'
  | 'CARD'
  | 'RACE_EVENT'
  | 'RACE_REGISTRATION'
  | 'RACE_LOCATION'
  | 'FORM'
  | 'PRODUCT'
  | 'CHECKOUT_STEP';

export type Channel = 'TELEGRAM' | 'EMAIL' | 'WEBSITE' | 'WHATSAPP';

export interface TrackingProps {
  race_name?: string;
  distance?: string;
  city?: string;
  location_name?: string;
  registration_link?: string;
  provider?: string;
  link_text?: string;
  link_href?: string;
  section?: string;
  position?: string;
  filter_name?: string;
  filter_value?: string;
  active?: string;
  uf?: string;
  [key: string]: string | undefined;
}

export interface TelegramContext {
  userId: number;
  chatId: number;
  messageId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}
