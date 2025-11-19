import { CommandInput, CommandOutput } from '../../../../types/Command.ts';
import { CallbackHandler } from '../../../../types/PlatformAdapter.ts';

type CommandHandler = (
  input: CommandInput,
  ...args: unknown[]
) => Promise<CommandOutput>;

export * from './commands/index.ts';

import { commands } from './commands/index.ts';

export const basicCallbackHandlers: CallbackHandler[] = [];
export const basicCommands: Record<string, CommandHandler> = commands;
