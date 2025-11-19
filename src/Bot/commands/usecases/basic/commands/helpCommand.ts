import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { basicMessages } from '../../../../presentation/messages/basic/basicMessages.ts';

export async function helpCommand(input: CommandInput): Promise<CommandOutput> {
  try {
    logger.info('Processing help command', {
      module: 'HelpCommand',
      action: 'process_help',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    const message = basicMessages.help;

    logger.info('Help command processed successfully', {
      module: 'HelpCommand',
      action: 'process_success',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    return {
      text: message,
      format: 'markdown',
    };
  } catch (error) {
    logger.error(
      'Error processing help command',
      {
        module: 'HelpCommand',
        action: 'process_error',
        platform: input.platform,
        userId: input.user?.id?.toString(),
      },
      error as Error
    );

    return {
      text: '❌ Erro interno. Tente novamente mais tarde.',
      format: 'markdown',
    };
  }
}
