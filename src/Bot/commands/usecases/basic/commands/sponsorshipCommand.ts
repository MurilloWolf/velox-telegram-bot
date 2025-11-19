import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { basicMessages } from '../../../../presentation/messages/basic/basicMessages.ts';

export async function sponsorshipCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    logger.info('Processing sponsorship command', {
      module: 'SponsorshipCommand',
      action: 'process_sponsorship',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    const message = basicMessages.sponsorship;

    logger.info('Sponsorship command processed successfully', {
      module: 'SponsorshipCommand',
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
      'Error processing sponsorship command',
      {
        module: 'SponsorshipCommand',
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
