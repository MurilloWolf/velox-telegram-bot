import { CommandInput, CommandOutput } from './Command.ts';
import { CallbackData } from './callbacks/index.ts';

export interface PlatformAdapter {
  sendMessage(chatId: string | number, output: CommandOutput): Promise<void>;
  editMessage(
    chatId: string | number,
    messageId: string | number,
    output: CommandOutput
  ): Promise<void>;
  handleCallback?(
    callbackData: string,
    chatId: string | number,
    messageId: string | number,
    userId: string | number
  ): Promise<void>;
}

export interface CallbackHandler {
  handle(input: CommandInput): Promise<CommandOutput>;
  canHandle(callbackData: CallbackData): boolean;
}
