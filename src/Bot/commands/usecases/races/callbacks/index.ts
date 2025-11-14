import { ufFilterCallbackHandler } from './ufFilterCallback.ts';
import { raceDetailCallbackHandler } from './raceDetailCallback.ts';
import { raceLocationCallbackHandler } from './raceLocationCallback.ts';

export const callbackHandlers = [
  ufFilterCallbackHandler,
  raceDetailCallbackHandler,
  raceLocationCallbackHandler,
];

export * from './ufFilterCallback.ts';
export * from './raceDetailCallback.ts';
export * from './raceLocationCallback.ts';
