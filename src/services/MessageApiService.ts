import { httpClient } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';
import { BotMessage, TelegramMessage } from '../types/Service.ts';
import { CommandInput } from '../types/Command.ts';

export class MessageApiService {
  private readonly baseUrl = '/bot/message';

  async sendMessageFromCommandInput(
    input: CommandInput,
    direction: 'INCOMING' | 'OUTGOING' = 'INCOMING'
  ): Promise<void> {
    if (!this.isTextMessage(input)) {
      logger.debug('Skipping non-text message', {
        module: 'MessageApiService',
        action: 'send_message_from_command_input',
        platform: input.platform,
        messageType: 'non-text',
      });
      return;
    }

    const botMessage = this.formatCommandInputToMessage(input, direction);
    logger.debug('Formatted BotMessage from CommandInput', {
      module: 'MessageApiService',
      action: 'format_command_input_to_message',
      botMessage: botMessage,
    });
    await this.sendMessage(botMessage);
  }

  private isTextMessage(input: CommandInput): boolean {
    if (!input.raw) {
      return true;
    }

    if (input.platform?.toLowerCase() === 'telegram') {
      const telegramMessage = input.raw as TelegramMessage;
      return Boolean(telegramMessage.text);
    }

    return true;
  }

  private async sendMessage(message: BotMessage): Promise<void> {
    try {
      await httpClient.post(this.baseUrl, message);

      logger.info('Successfully sent message to bot API', {
        module: 'MessageApiService',
        action: 'send_message',
        externalId: message.externalId,
        direction: message.direction,
        channel: message.channel,
      });
    } catch (error) {
      logger.error(
        'Error sending message to bot API',
        {
          module: 'MessageApiService',
          action: 'send_message',
          externalId: message.externalId,
          direction: message.direction,
          channel: message.channel,
        },
        error as Error
      );
      throw error;
    }
  }

  private formatCommandInputToMessage(
    input: CommandInput,
    direction: 'INCOMING' | 'OUTGOING' = 'INCOMING'
  ): BotMessage {
    const platform = input.platform?.toUpperCase() as 'TELEGRAM' | 'WHATSAPP';

    if (platform === 'TELEGRAM' && input.raw) {
      return this.formatTelegramToMessage(
        input.raw as TelegramMessage,
        direction
      );
    }

    return this.createFallbackMessage(input, direction);
  }

  private formatTelegramToMessage(
    telegramMessage: TelegramMessage,
    direction: 'INCOMING' | 'OUTGOING' = 'INCOMING'
  ): BotMessage {
    const displayName = telegramMessage.from
      ? `${telegramMessage.from.first_name}${telegramMessage.from.last_name ? ` ${telegramMessage.from.last_name}` : ''}`
      : telegramMessage.chat.first_name ||
        telegramMessage.chat.title ||
        'Unknown';

    return {
      externalId:
        telegramMessage.from?.id.toString() ||
        telegramMessage.chat.id.toString(),
      direction,
      channel: 'TELEGRAM',
      text: telegramMessage.text || '',
      interactionType: 'TEXT',
      metadata: {
        messageId: telegramMessage.message_id.toString(),
        timestamp: Date.now(),
      },
      contact: {
        displayName,
        metaData: {
          username:
            telegramMessage.from?.username || telegramMessage.chat.username,
        },
        lastSeen: new Date().toISOString(),
      },
    };
  }

  private createFallbackMessage(
    input: CommandInput,
    direction: 'INCOMING' | 'OUTGOING'
  ): BotMessage {
    return {
      externalId: input.user?.id?.toString() || Date.now().toString(),
      direction,
      channel:
        (input.platform?.toUpperCase() as 'TELEGRAM' | 'WHATSAPP') ||
        'TELEGRAM',
      text: input.args?.join(' ') || '',
      interactionType: 'TEXT',
      metadata: {
        messageId: input.messageId?.toString() || Date.now().toString(),
        timestamp: Date.now(),
      },
      contact: {
        displayName: input.user?.name || 'Unknown User',
        metaData: {},
        lastSeen: new Date().toISOString(),
      },
    };
  }
}

export const messageApiService = new MessageApiService();
