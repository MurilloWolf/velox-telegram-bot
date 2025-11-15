import { ufFilterCallbackHandler } from './ufFilterCallback.ts';
import { distanceFilterCallbackHandler } from './distanceFilterCallback.ts';
import { raceDetailCallbackHandler } from './raceDetailCallback.ts';
import { raceLocationCallbackHandler } from './raceLocationCallback.ts';

export const callbackHandlers = [
  ufFilterCallbackHandler,
  distanceFilterCallbackHandler,
  raceDetailCallbackHandler,
  raceLocationCallbackHandler,
];

export * from './ufFilterCallback.ts';
export * from './distanceFilterCallback.ts';
export * from './raceDetailCallback.ts';
export * from './raceLocationCallback.ts';
