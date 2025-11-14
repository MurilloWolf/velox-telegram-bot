export * from './callbacks/index.ts';

import { NavigationCallbackHandler } from './callbacks/index.ts';

export const sharedCallbackHandlers = [new NavigationCallbackHandler()];
