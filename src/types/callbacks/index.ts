export * from './raceCallbacks.ts';
export * from './sharedCallbacks.ts';
import { RaceCallbackData } from './raceCallbacks.ts';
import { SharedCallbackData } from './sharedCallbacks.ts';

export type CallbackData = RaceCallbackData | SharedCallbackData;
