import { CommandOutput } from '../../../../types/Command.ts';
import { FavoriteRace } from '../../../../services/index.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';

export const raceFavoritesView = {
  createFavoritesListView: (favoriteRaces: FavoriteRace[]): CommandOutput => {
    if (favoriteRaces.length === 0) {
      return {
        text: raceMessages.titles.noFavorites,
        format: 'HTML',
        editMessage: true,
        keyboard: {
          buttons: raceKeyboards.createNavigationToAllRacesButtons(),
          inline: true,
        },
      };
    }

    return {
      text: raceMessages.titles.favoritesList(favoriteRaces.length),
      format: 'HTML',
      editMessage: true,
      keyboard: {
        buttons: [
          ...raceKeyboards.createFavoriteRaceListButtons(favoriteRaces),
          ...raceKeyboards.createNavigationToAllRacesButtons(),
        ],
        inline: true,
      },
    };
  },

  createErrorView: (): CommandOutput => ({
    text: raceMessages.errors.genericError,
    format: 'HTML',
    editMessage: true,
  }),
};
