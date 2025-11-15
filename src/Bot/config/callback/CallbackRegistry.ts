import { CallbackHandler } from '../../../types/PlatformAdapter.ts';
import { callbackManager } from './CallbackManager.ts';
import { logger } from '../../../utils/Logger.ts';

export class CallbackRegistry {
  private static instance: CallbackRegistry;
  private registeredHandlers: Set<string> = new Set();

  static getInstance(): CallbackRegistry {
    if (!CallbackRegistry.instance) {
      CallbackRegistry.instance = new CallbackRegistry();
    }
    return CallbackRegistry.instance;
  }

  autoRegisterHandlers(): void {
    this.registerHandlersFromModule('races');
    this.registerHandlersFromModule('shared');

    logger.info(
      `Total de ${this.registeredHandlers.size} callback handlers registrados automaticamente`,
      {
        module: 'CallbackRegistry',
        action: 'auto_register_complete',
        handlerCount: this.registeredHandlers.size,
      }
    );
  }

  private async registerHandlersFromModule(moduleName: string): Promise<void> {
    try {
      switch (moduleName) {
        case 'races': {
          const { raceCallbackHandlers } = await import(
            '../../commands/usecases/races/index.ts'
          );
          this.registerHandlers(raceCallbackHandlers, 'races');
          break;
        }
        case 'shared': {
          const { sharedCallbackHandlers } = await import(
            '../../commands/usecases/shared/index.ts'
          );
          this.registerHandlers(sharedCallbackHandlers, 'shared');
          break;
        }
        default:
          logger.warn(`Módulo desconhecido: ${moduleName}`, {
            module: 'CallbackRegistry',
            action: 'register_unknown_module',
            moduleName,
          });
      }
    } catch (error) {
      logger.error(
        `Erro ao registrar handlers do módulo ${moduleName}`,
        {
          module: 'CallbackRegistry',
          action: 'register_error',
          moduleName,
        },
        error as Error
      );
    }
  }

  private registerHandlers(handlers: CallbackHandler[], module: string): void {
    handlers.forEach(handler => {
      const handlerName = handler.constructor.name;

      if (!this.registeredHandlers.has(handlerName)) {
        callbackManager.registerHandler(handler);
        this.registeredHandlers.add(handlerName);
        logger.registryOperation('callback', handlerName, module);
      } else {
        logger.warn(`Handler ${handlerName} já foi registrado`, {
          module: 'CallbackRegistry',
          action: 'duplicate_handler',
          handlerName,
          handlerModule: module,
        });
      }
    });
  }

  getRegisteredHandlers(): string[] {
    return Array.from(this.registeredHandlers);
  }

  clearRegistry(): void {
    this.registeredHandlers.clear();
    logger.info('Registry limpo', {
      module: 'CallbackRegistry',
      action: 'clear_registry',
    });
  }
}
