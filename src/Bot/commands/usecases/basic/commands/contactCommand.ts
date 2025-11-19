import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { basicMessages } from '../../../../presentation/messages/basic/basicMessages.ts';

export async function contactCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    logger.info('Processing contact command', {
      module: 'ContactCommand',
      action: 'process_contact',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    const message = basicMessages.contact;

    logger.info('Contact command processed successfully', {
      module: 'ContactCommand',
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
      'Error processing contact command',
      {
        module: 'ContactCommand',
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
