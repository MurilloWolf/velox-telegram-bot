import { listRacesCommand } from './listRaces.ts';
import { listFavoriteRacesCommand } from './listFavoriteRaces.ts';

export const commands = {
  corridas: listRacesCommand,
  races: listRacesCommand,
  listRaces: listRacesCommand,
  favoritos: listFavoriteRacesCommand,
  favoritas: listFavoriteRacesCommand,
  favorites: listFavoriteRacesCommand,
  listFavoriteRaces: listFavoriteRacesCommand,
};

export * from './listRaces.ts';
export * from './listFavoriteRaces.ts';
