import { CallbackHandler } from '../../../../types/PlatformAdapter.js';
import { CommandInput, CommandOutput } from '../../../../types/Command.js';

type CommandHandler = (
  input: CommandInput,
  ...args: unknown[]
) => Promise<CommandOutput>;

export * from './commands/index.js';
export * from './callbacks/index.js';

import { commands } from './commands/index.js';
import { callbackHandlers } from './callbacks/index.js';

export const raceCallbackHandlers: CallbackHandler[] = callbackHandlers;
export const raceCommands: Record<string, CommandHandler> = commands;
