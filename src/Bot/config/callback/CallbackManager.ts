import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { CallbackHandler } from '@app-types/PlatformAdapter.ts';
import { CallbackData } from '@app-types/callbacks/index.ts';
import { logger } from '../../../utils/Logger.ts';

class CallbackManager {
  private handlers: CallbackHandler[] = [];

  registerHandler(handler: CallbackHandler) {
    this.handlers.push(handler);
  }

  async handleCallback(
    callbackData: CallbackData,
    input: CommandInput
  ): Promise<CommandOutput | null> {
    const handler = this.handlers.find(h => h.canHandle(callbackData));

    if (!handler) {
      logger.warn(`No handler found for callback type: ${callbackData.type}`, {
        module: 'CallbackManager',
        action: 'no_handler_found',
        callbackType: callbackData.type,
        userId: input.user?.id?.toString(),
      });
      return {
        text: '❌ Ação não encontrada.',
        format: 'HTML',
      };
    }

    return await handler.handle({
      ...input,
      callbackData,
    });
  }
}

export const callbackManager = new CallbackManager();
