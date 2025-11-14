import { listRacesCommand } from './listRaces.ts';

export const commands = {
  corridas: listRacesCommand,
  races: listRacesCommand,
  listRaces: listRacesCommand,
};

export * from './listRaces.ts';
