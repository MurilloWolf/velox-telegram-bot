import { CommandInput, CommandOutput } from '../../types/Command.ts';
import {
  MessageType,
  MessageTypeValue,
  TelegramMessage,
  WhatsAppMessage,
} from '../../types/MessageInterceptor.ts';
import { logger } from '../../utils/Logger.ts';
import { basicMessages } from '../presentation/messages/basic/basicMessages.ts';

export class MediaRestrictionMiddleware {
  private static readonly RESTRICTED_MEDIA_TYPES: MessageTypeValue[] = [
    MessageType.PHOTO,
    MessageType.VIDEO,
    MessageType.DOCUMENT,
    MessageType.AUDIO,
    MessageType.VOICE,
    MessageType.LOCATION,
    MessageType.CONTACT,
    MessageType.POLL,
    MessageType.OTHER,
  ];

  static async checkMediaRestriction(
    input: CommandInput
  ): Promise<CommandOutput | null> {
    try {
      logger.info('Checking media restriction', {
        module: 'MediaRestrictionMiddleware',
        action: 'check_restriction',
        platform: input.platform,
        userId: input.user?.id?.toString(),
      });

      const messageType = this.extractMessageType(input);

      if (messageType && this.RESTRICTED_MEDIA_TYPES.includes(messageType)) {
        logger.info('Media restriction triggered', {
          module: 'MediaRestrictionMiddleware',
          action: 'restriction_triggered',
          platform: input.platform,
          userId: input.user?.id?.toString(),
          messageType: messageType.toString(),
        });

        return {
          text: basicMessages.mediaRestriction,
          format: 'markdown',
        };
      }

      logger.debug('Media restriction check passed', {
        module: 'MediaRestrictionMiddleware',
        action: 'restriction_passed',
        platform: input.platform,
        userId: input.user?.id?.toString(),
        messageType: messageType?.toString(),
      });

      return null;
    } catch (error) {
      logger.error(
        'Error checking media restriction',
        {
          module: 'MediaRestrictionMiddleware',
          action: 'check_error',
          platform: input.platform,
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return null;
    }
  }

  private static extractMessageType(
    input: CommandInput
  ): MessageTypeValue | null {
    try {
      if (input.platform === 'telegram' && input.raw) {
        const telegramMessage = input.raw as TelegramMessage;

        if (telegramMessage.text) {
          return MessageType.TEXT;
        }
        if (telegramMessage.photo) {
          return MessageType.PHOTO;
        }
        if (telegramMessage.video) {
          return MessageType.VIDEO;
        }
        if (telegramMessage.document) {
          return MessageType.DOCUMENT;
        }
        if (telegramMessage.audio) {
          return MessageType.AUDIO;
        }
        if (telegramMessage.voice) {
          return MessageType.VOICE;
        }
        if (telegramMessage.location) {
          return MessageType.LOCATION;
        }
        if (telegramMessage.contact) {
          return MessageType.CONTACT;
        }
        if (telegramMessage.poll) {
          return MessageType.POLL;
        }

        return MessageType.OTHER;
      }

      // For WhatsApp, implement similar logic when needed
      if (input.platform === 'whatsapp' && input.raw) {
        const whatsappMessage = input.raw as WhatsAppMessage;

        if (whatsappMessage.type === 'text') {
          return MessageType.TEXT;
        }
        if (whatsappMessage.type === 'image') {
          return MessageType.PHOTO;
        }
        if (whatsappMessage.type === 'video') {
          return MessageType.VIDEO;
        }
        if (whatsappMessage.type === 'document') {
          return MessageType.DOCUMENT;
        }
        if (whatsappMessage.type === 'audio') {
          return MessageType.AUDIO;
        }
        if (whatsappMessage.type === 'voice') {
          return MessageType.VOICE;
        }
        if (whatsappMessage.type === 'location') {
          return MessageType.LOCATION;
        }
        if (whatsappMessage.type === 'contact') {
          return MessageType.CONTACT;
        }

        return MessageType.OTHER;
      }

      return null;
    } catch (error) {
      logger.error(
        'Error extracting message type',
        {
          module: 'MediaRestrictionMiddleware',
          action: 'extract_type_error',
          platform: input.platform,
        },
        error as Error
      );

      return null;
    }
  }
}
