import TelegramBot, {
  Message,
  ParseMode,
  CallbackQuery,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from 'node-telegram-bot-api';
import { routeCommand } from '@bot/router/CommandRouter.ts';
import {
  CommandInput,
  CommandOutput,
  InteractionKeyboard,
} from '../../../types/Command.ts';
import { PlatformAdapter } from '../../../types/PlatformAdapter.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { callbackManager } from '@bot/config/callback/CallbackManager.ts';
import { MediaRestrictionMiddleware } from '@bot/middleware/MediaRestrictionMiddleware.ts';
import parseCommand from '../../../utils/parseCommand.ts';
import { stripFormatting } from '../../../utils/markdownUtils.ts';
import { logger } from '../../../utils/Logger.ts';

export class TelegramPlatformAdapter implements PlatformAdapter {
  constructor(private bot: TelegramBot) {}

  private convertKeyboardToTelegram(
    keyboard?: InteractionKeyboard
  ): InlineKeyboardMarkup | ReplyKeyboardMarkup | undefined {
    if (!keyboard) {
      return undefined;
    }

    if (keyboard.inline) {
      return {
        inline_keyboard: keyboard.buttons.map(row =>
          row.map(button => ({
            text: button.text,
            callback_data: button.callbackData
              ? CallbackDataSerializer.serialize(button.callbackData)
              : undefined,
            url: button.url,
          }))
        ),
      };
    } else {
      return {
        keyboard: keyboard.buttons.map(row =>
          row.map(button => ({
            text: button.text,
          }))
        ),
        resize_keyboard: true,
        one_time_keyboard: true,
      };
    }
  }

  async sendMessage(
    chatId: string | number,
    output: CommandOutput
  ): Promise<void> {
    try {
      if (output.location) {
        await this.bot.sendLocation(
          chatId,
          output.location.latitude,
          output.location.longitude
        );
      }

      const keyboard = this.convertKeyboardToTelegram(output.keyboard);

      if (output.messages && output.messages.length > 0) {
        for (const message of output.messages) {
          await this.bot.sendMessage(chatId, message, {
            parse_mode: (output.format as ParseMode) || undefined,
            reply_markup: keyboard,
          });
        }
      } else {
        await this.bot.sendMessage(chatId, output.text, {
          parse_mode: (output.format as ParseMode) || undefined,
          reply_markup: keyboard,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to send formatted message',
        {
          module: 'TelegramBotAdapter',
          action: 'send_message_error',
          chatId: chatId.toString(),
        },
        error as Error
      );
      await this.bot.sendMessage(chatId, stripFormatting(output.text));
    }
  }

  async editMessage(
    chatId: string | number,
    messageId: string | number,
    output: CommandOutput
  ): Promise<void> {
    try {
      if (output.location) {
        await this.sendMessage(chatId, output);
        return;
      }

      const keyboard = this.convertKeyboardToTelegram(output.keyboard);

      await this.bot.editMessageText(output.text, {
        chat_id: chatId,
        message_id: Number(messageId),
        parse_mode: (output.format as ParseMode) || undefined,
        reply_markup: keyboard as InlineKeyboardMarkup,
      });
    } catch (error) {
      logger.messageError('telegram', error as Error, chatId.toString());
      // Fallback: send new message
      await this.sendMessage(chatId, output);
    }
  }

  async handleCallback(
    callbackData: string,
    chatId: string | number,
    messageId: string | number,
    userId: string | number
  ): Promise<void> {
    try {
      const parsedCallbackData =
        CallbackDataSerializer.deserialize(callbackData);

      const input: CommandInput = {
        user: { id: userId },
        platform: 'telegram',
        callbackData: parsedCallbackData,
        messageId,
      };

      const output = await callbackManager.handleCallback(
        parsedCallbackData,
        input
      );

      if (output) {
        if (output.editMessage) {
          await this.editMessage(chatId, messageId, output);
        } else {
          await this.sendMessage(chatId, output);
        }
      }
    } catch (error) {
      logger.callbackError(
        'unknown',
        error as Error,
        userId.toString(),
        chatId.toString()
      );
      await this.sendMessage(chatId, {
        text: '❌ Erro ao processar ação.',
        format: 'HTML',
      });
    }
  }
}

export async function handleTelegramMessage(bot: TelegramBot, msg: Message) {
  logger.messageReceived(
    'telegram',
    msg.chat.id.toString(),
    msg.from?.id?.toString(),
    'telegram_message'
  );

  const input: CommandInput = {
    user: { id: msg.from?.id, name: msg.from?.first_name },
    args: [],
    platform: 'telegram',
    raw: msg,
  };

  const mediaRestrictionOutput =
    await MediaRestrictionMiddleware.checkMediaRestriction(input);
  if (mediaRestrictionOutput) {
    const adapter = new TelegramPlatformAdapter(bot);
    await adapter.sendMessage(msg.chat.id, mediaRestrictionOutput);
    return;
  }

  if (!msg.text) {
    return;
  }

  const { command, args } = parseCommand(msg.text);

  if (!command) {
    return;
  }

  logger.debug(`Command parsed: ${command} with args: ${args.join(', ')}`, {
    module: 'TelegramBotAdapter',
    action: 'parse_command',
    commandName: command,
    userId: msg.from?.id?.toString(),
    chatId: msg.chat.id.toString(),
  });

  // Update input with parsed command args
  input.args = args;

  const output = await routeCommand(command, input);

  logger.debug(`Sending response for command: ${command}`, {
    module: 'TelegramBotAdapter',
    action: 'send_response',
    commandName: command,
    userId: msg.from?.id?.toString(),
    chatId: msg.chat.id.toString(),
  });

  if (!output || !output.text) {
    logger.warn(`No output text for command ${command}. Skipping message.`, {
      module: 'TelegramBotAdapter',
      action: 'no_output',
      commandName: command,
      userId: msg.from?.id?.toString(),
    });
    return;
  }

  const adapter = new TelegramPlatformAdapter(bot);
  await adapter.sendMessage(msg.chat.id, output);
}

export async function handleTelegramCallback(
  bot: TelegramBot,
  callbackQuery: CallbackQuery
) {
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;

  if (!chatId || !messageId || !callbackData) {
    return;
  }

  logger.callbackExecution(callbackData, userId.toString(), chatId.toString());

  const adapter = new TelegramPlatformAdapter(bot);
  await adapter.handleCallback(callbackData, chatId, messageId, userId);

  // Acknowledge the callback
  await bot.answerCallbackQuery(callbackQuery.id);
}

export default function startTelegramBot() {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, {
    polling: true,
  });

  bot.on('message', async msg => await handleTelegramMessage(bot, msg));
  bot.on(
    'callback_query',
    async callbackQuery => await handleTelegramCallback(bot, callbackQuery)
  );
}
