// Types for different message directions and types
export enum MessageDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export enum MessageType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  VOICE = 'VOICE',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  POLL = 'POLL',
  OTHER = 'OTHER',
}

export enum ChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  SUPERGROUP = 'SUPERGROUP',
  CHANNEL = 'CHANNEL',
}

export type MessageTypeValue = keyof typeof MessageType;
export type ChatTypeValue = keyof typeof ChatType;
export type MessageDirectionValue = keyof typeof MessageDirection;
export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string; // For private chats
    last_name?: string; // For private chats
    all_members_are_administrators?: boolean;
  };
  from?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
  photo?: unknown;
  video?: unknown;
  document?: unknown;
  audio?: unknown;
  voice?: unknown;
  location?: unknown;
  contact?: unknown;
  poll?: unknown;
  reply_to_message?: {
    message_id: number;
  };
  edit_date?: number;
}
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text?: string;
  type: string;
  timestamp: number;
}

// Extracted message data interface
export interface ExtractedMessageData {
  messageId: number;
  chatId: string;
  chatType: ChatTypeValue;
  chatTitle?: string;
  chatUsername?: string;
  memberCount?: number;
  text?: string;
  messageType: MessageTypeValue;
  replyToId?: string;
  editedAt?: Date;
}
export type SupportedPlatform = 'telegram' | 'whatsapp';
export type PlatformMessage = TelegramMessage | WhatsAppMessage;
