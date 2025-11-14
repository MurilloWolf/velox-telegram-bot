import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { logger } from '../../../utils/Logger.ts';

type CommandHandler = (
  input: CommandInput,
  ...args: unknown[]
) => Promise<CommandOutput>;

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, CommandHandler> = new Map();
  private registeredModules: Set<string> = new Set();

  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  async autoRegisterCommands(): Promise<void> {
    logger.info('Registrando comandos automaticamente...', {
      module: 'CommandRegistry',
      action: 'auto_register_start',
    });

    await this.registerCommandsFromModule('races');

    logger.moduleRegistration('CommandRegistry', 'command', this.commands.size);
  }

  private async registerCommandsFromModule(moduleName: string): Promise<void> {
    if (this.registeredModules.has(moduleName)) {
      logger.warn(`Módulo ${moduleName} já foi registrado`, {
        module: 'CommandRegistry',
        action: 'duplicate_module',
        moduleName,
      });
      return;
    }

    try {
      switch (moduleName) {
        default:
          logger.warn(`Módulo desconhecido: ${moduleName}`, {
            module: 'CommandRegistry',
            action: 'unknown_module',
            moduleName,
          });
          return;
      }
    } catch (error) {
      logger.error(
        `Erro ao registrar comandos do módulo ${moduleName}`,
        {
          module: 'CommandRegistry',
          action: 'register_error',
          moduleName,
        },
        error as Error
      );
    }
  }

  private registerCommands(
    commands: Record<string, CommandHandler>,
    module: string
  ): void {
    Object.entries(commands).forEach(([commandName, handler]) => {
      if (!this.commands.has(commandName)) {
        this.commands.set(commandName, handler);
        logger.registryOperation('command', commandName, module);
      } else {
        logger.duplicateRegistration('command', commandName, module);
      }
    });
  }

  getHandler(command: string): CommandHandler | undefined {
    return this.commands.get(command);
  }

  getAllCommands(): string[] {
    return Array.from(this.commands.keys()).sort();
  }

  hasCommand(command: string): boolean {
    return this.commands.has(command);
  }

  clearRegistry(): void {
    this.commands.clear();
    this.registeredModules.clear();
    logger.info('Command registry limpo', {
      module: 'CommandRegistry',
      action: 'clear_registry',
    });
  }
}
