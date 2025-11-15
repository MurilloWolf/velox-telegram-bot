import { ufFilterCallbackHandler } from './ufFilterCallback.ts';
import { distanceFilterCallbackHandler } from './distanceFilterCallback.ts';
import { raceDetailCallbackHandler } from './raceDetailCallback.ts';
import { raceLocationCallbackHandler } from './raceLocationCallback.ts';
import { raceRegistrationCallbackHandler } from './raceRegistrationCallback.ts';
import {
  raceFavoriteCallbackHandler,
  raceUnfavoriteCallbackHandler,
} from './raceFavoriteToggleCallback.ts';
import { raceListFavoriteCallbackHandler } from './raceListFavoriteCallback.ts';
import { raceListCallbackHandler } from './raceListCallback.ts';
import { raceFilterCallbackHandler } from './raceFilterCallback.ts';

export const callbackHandlers = [
  ufFilterCallbackHandler,
  distanceFilterCallbackHandler,
  raceDetailCallbackHandler,
  raceLocationCallbackHandler,
  raceRegistrationCallbackHandler,
  raceFavoriteCallbackHandler,
  raceUnfavoriteCallbackHandler,
  raceListFavoriteCallbackHandler,
  raceListCallbackHandler,
  raceFilterCallbackHandler,
];

export * from './ufFilterCallback.ts';
export * from './distanceFilterCallback.ts';
export * from './raceDetailCallback.ts';
export * from './raceLocationCallback.ts';
export * from './raceRegistrationCallback.ts';
export * from './raceFavoriteToggleCallback.ts';
export * from './raceListFavoriteCallback.ts';
export * from './raceListCallback.ts';
export * from './raceFilterCallback.ts';
