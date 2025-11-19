import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { basicMessages } from '../../../../presentation/messages/basic/basicMessages.ts';

interface TelegramUser {
  first_name?: string;
  username?: string;
}

interface WhatsAppUser {
  name?: string;
}

export async function startCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    logger.info('Processing start command', {
      module: 'StartCommand',
      action: 'process_start',
      platform: input.platform,
      userId: input.user?.id?.toString(),
    });

    let userName = 'usuário';

    if (input.platform === 'telegram' && input.user) {
      const telegramUser = input.user as TelegramUser;
      userName = telegramUser.first_name || telegramUser.username || 'usuário';
    } else if (input.platform === 'whatsapp' && input.user) {
      const whatsappUser = input.user as WhatsAppUser;
      userName = whatsappUser.name || 'usuário';
    }

    const message = basicMessages.start(userName);

    logger.info('Start command processed successfully', {
      module: 'StartCommand',
      action: 'process_success',
      platform: input.platform,
      userId: input.user?.id?.toString(),
      userName,
    });

    return {
      text: message,
      format: 'markdown',
    };
  } catch (error) {
    logger.error(
      'Error processing start command',
      {
        module: 'StartCommand',
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
