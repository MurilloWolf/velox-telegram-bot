import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  UfFilterCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { distanceFilterView } from '../../../../presentation/views/races/distanceFilterView.ts';

export class UfFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'uf_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    const data = input.callbackData as UfFilterCallbackData;
    const { uf } = data;

    return distanceFilterView.createDistanceFilterView(uf);
  }
}

export const ufFilterCallbackHandler = new UfFilterCallbackHandler();
