import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { basicMessages } from '../../../../presentation/messages/basic/basicMessages.ts';

export async function aboutCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    logger.info('Processing about command', {
      module: 'AboutCommand',
      action: 'process_about',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    const message = basicMessages.about;

    logger.info('About command processed successfully', {
      module: 'AboutCommand',
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
      'Error processing about command',
      {
        module: 'AboutCommand',
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
