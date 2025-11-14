import { CallbackData } from './callbacks/index.ts';

export interface CommandInput {
  user?: { id?: number | string; name?: string };
  args?: string[];
  platform?: string;
  raw?: unknown;
  callbackData?: CallbackData;
  messageId?: number | string;
}

export interface InteractionButton {
  text: string;
  callbackData?: CallbackData;
  url?: string;
}

export interface InteractionKeyboard {
  buttons: InteractionButton[][];
  inline?: boolean;
}
export interface CommandOutput {
  text: string;
  format?: 'markdown' | 'html' | 'markdownV2' | string;
  messages?: string[];
  keyboard?: InteractionKeyboard;
  editMessage?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}
