import { BaseCallbackData } from './raceCallbacks.ts';

export interface NavigationCallbackData extends BaseCallbackData {
  type: 'navigation';
  action: 'back' | 'next' | 'close';
  target: string;
}

export type SharedCallbackData = NavigationCallbackData;
