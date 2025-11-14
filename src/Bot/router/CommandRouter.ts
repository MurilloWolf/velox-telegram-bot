import { CommandRegistry } from '@bot/config/commands/CommandRegistry.ts';
import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { messageInterceptor } from '@bot/middleware/MessageInterceptor.ts';
import { logger } from '../../utils/Logger.ts';

let commandRegistry: CommandRegistry | null = null;

async function getCommandRegistry(): Promise<CommandRegistry> {
  if (!commandRegistry) {
    commandRegistry = CommandRegistry.getInstance();
    try {
      await commandRegistry.autoRegisterCommands();
    } catch (error) {
      logger.error(
        'Erro ao inicializar registry de comandos',
        {
          module: 'CommandRouter',
          action: 'initialize_registry',
        },
        error as Error
      );
    }
  }
  return commandRegistry;
}

export async function routeCommand(
  command: string,
  input: CommandInput
): Promise<CommandOutput> {
  let output: CommandOutput = {
    text: '',
    format: 'HTML',
  };
  try {
    await messageInterceptor.interceptIncomingMessage(input);

    const registry = await getCommandRegistry();
    const handler = registry.getHandler(command);

    if (handler) {
      logger.commandExecution(command, input.user?.id?.toString());
      output = await handler(input);
      await messageInterceptor.interceptOutgoingMessage(input, output);
      return output;
    }

    logger.warn(`Comando não encontrado: /${command}`, {
      module: 'CommandRouter',
      action: 'command_not_found',
      commandName: command,
      userId: input.user?.id?.toString(),
    });
    output = {
      text: '❌ Comando não reconhecido.\nUse /ajuda para ver os comandos disponíveis.',
      format: 'HTML',
    };
  } catch (error) {
    logger.commandError(command, error as Error, input.user?.id?.toString());
    output = {
      text: '❌ Erro interno. Tente novamente mais tarde.',
      format: 'HTML',
    };
  } finally {
    await messageInterceptor.interceptOutgoingMessage(input, output);
  }

  return output;
}

export async function getAvailableCommands(): Promise<string[]> {
  try {
    const registry = await getCommandRegistry();
    const registryCommands = registry.getAllCommands();

    const allCommands = [...new Set([...registryCommands])];
    return allCommands.sort();
  } catch (error) {
    logger.error(
      'Erro ao obter comandos disponíveis',
      {
        module: 'CommandRouter',
        action: 'get_available_commands',
      },
      error as Error
    );
    return [];
  }
}
