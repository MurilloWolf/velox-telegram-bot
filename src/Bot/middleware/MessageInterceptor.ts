/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { logger } from '../../utils/Logger.ts';
import {
  MessageType,
  ChatType,
  TelegramMessage,
  WhatsAppMessage,
  ExtractedMessageData,
  MessageTypeValue,
  ChatTypeValue,
  SupportedPlatform,
} from '../../types/MessageInterceptor.ts';

export class MessageInterceptor {
  async interceptIncomingMessage(input: CommandInput): Promise<void> {
    try {
      // todo
    } catch (error) {
      logger.error(
        'Error intercepting incoming message',
        {
          module: 'MessageInterceptor',
          action: 'intercept_incoming',
        },
        error as Error
      );
    }
  }
  async interceptOutgoingMessage(
    input: CommandInput,
    output: CommandOutput
  ): Promise<void> {
    try {
      // todo
    } catch (error) {
      logger.error(
        'Error intercepting incoming message',
        {
          module: 'MessageInterceptor',
          action: 'intercept_incoming',
        },
        error as Error
      );
    }
  }

  private extractMessageData(input: CommandInput): ExtractedMessageData | null {
    try {
      const platform = input.platform as SupportedPlatform;

      switch (platform) {
        case 'telegram':
          return this.extractTelegramMessageData(input.raw as TelegramMessage);
        case 'whatsapp':
          return this.extractWhatsAppMessageData(input.raw as WhatsAppMessage);
        default:
          logger.warn(`Platform not supported: ${input.platform}`, {
            module: 'MessageInterceptor',
            action: 'extract_message_data',
            platform: input.platform,
          });
          return null;
      }
    } catch (error) {
      logger.error(
        'Error extracting message data',
        {
          module: 'MessageInterceptor',
          action: 'extract_message_data',
          platform: input.platform,
        },
        error as Error
      );
      return null;
    }
  }

  private extractTelegramMessageData(
    msg: TelegramMessage
  ): ExtractedMessageData | null {
    if (!msg || !msg.chat || !msg.message_id) {
      return null;
    }

    let chatTitle: string | undefined;
    if (msg.chat.type === 'private') {
      const firstName = msg.chat.first_name || '';
      const lastName = msg.chat.last_name || '';
      chatTitle = lastName ? `${firstName} ${lastName}` : firstName;

      logger.debug('Título do chat privado construído', {
        module: 'MessageInterceptor',
        action: 'build_chat_title',
        chatTitle,
        firstName,
        lastName,
      });
    } else {
      chatTitle = msg.chat.title;

      logger.debug('Título do grupo/canal', {
        module: 'MessageInterceptor',
        action: 'get_group_title',
        chatTitle,
      });
    }

    return {
      messageId: msg.message_id,
      chatId: msg.chat.id.toString(),
      chatType: this.convertTelegramChatType(msg.chat.type),
      chatTitle: chatTitle,
      chatUsername: msg.chat.username,
      memberCount: msg.chat.all_members_are_administrators
        ? undefined
        : undefined,
      text: msg.text,
      messageType: this.convertTelegramMessageType(msg),
      replyToId: msg.reply_to_message?.message_id
        ? msg.reply_to_message.message_id.toString()
        : undefined,
      editedAt: msg.edit_date ? new Date(msg.edit_date * 1000) : undefined,
    };
  }

  private extractWhatsAppMessageData(
    _msg: WhatsAppMessage
  ): ExtractedMessageData | null {
    logger.debug('WhatsApp message received', {
      module: 'MessageInterceptor',
      action: 'extract_whatsapp_data',
      message: JSON.stringify(_msg),
    });

    logger.warn('WhatsApp data extraction not yet implemented', {
      module: 'MessageInterceptor',
      action: 'extract_whatsapp_data',
    });

    return null;
  }

  private convertTelegramChatType(type: string): ChatTypeValue {
    switch (type) {
      case 'private':
        return ChatType.PRIVATE;
      case 'group':
        return ChatType.GROUP;
      case 'supergroup':
        return ChatType.SUPERGROUP;
      case 'channel':
        return ChatType.CHANNEL;
      default:
        logger.warn('Tipo de chat Telegram desconhecido', {
          module: 'MessageInterceptor',
          action: 'convert_telegram_chat_type',
          unknownType: type,
        });
        return ChatType.PRIVATE;
    }
  }

  private convertTelegramMessageType(msg: TelegramMessage): MessageTypeValue {
    if (msg.text) {
      return MessageType.TEXT;
    }
    if (msg.photo) {
      return MessageType.PHOTO;
    }
    if (msg.video) {
      return MessageType.VIDEO;
    }
    if (msg.document) {
      return MessageType.DOCUMENT;
    }
    if (msg.audio) {
      return MessageType.AUDIO;
    }
    if (msg.voice) {
      return MessageType.VOICE;
    }
    if (msg.location) {
      return MessageType.LOCATION;
    }
    if (msg.contact) {
      return MessageType.CONTACT;
    }
    if (msg.poll) {
      return MessageType.POLL;
    }

    logger.debug('Tipo de mensagem não identificado, usando OTHER', {
      module: 'MessageInterceptor',
      action: 'convert_telegram_message_type',
      messageId: msg.message_id,
    });

    return MessageType.OTHER;
  }
}

export const messageInterceptor = new MessageInterceptor();
