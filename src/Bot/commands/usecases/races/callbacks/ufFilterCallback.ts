import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import { CallbackData } from '../../../../../types/callbacks/index.ts';
import { listRacesCommand } from '../commands/listRaces.ts';

export class UfFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'uf_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    return await listRacesCommand(input);
  }
}

export const ufFilterCallbackHandler = new UfFilterCallbackHandler();