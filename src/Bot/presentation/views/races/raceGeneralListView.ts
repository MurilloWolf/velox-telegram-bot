import { CommandOutput } from '../../../../types/Command.ts';
import { Race } from '../../../../types/Service.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';

export const raceGeneralListView = {
  createGeneralRaceListView: (
    races: Race[],
    distance?: number
  ): CommandOutput => {
    if (races.length === 0) {
      return {
        text: distance
          ? raceMessages.errors.noRacesFoundForDistance(distance)
          : raceMessages.errors.noRacesAvailable,
        format: 'HTML',
        editMessage: true,
        keyboard: {
          buttons: raceKeyboards.createGeneralRaceListNavigationButtons(),
          inline: true,
        },
      };
    }

    return {
      text: distance
        ? raceMessages.titles.racesForDistance(distance, races.length)
        : raceMessages.titles.allRacesAvailable(races.length),
      format: 'HTML',
      editMessage: true,
      keyboard: {
        buttons: [
          ...raceKeyboards.createGeneralRaceListButtons(races),
          ...raceKeyboards.createGeneralRaceFilterButtons(),
        ],
        inline: true,
      },
    };
  },

  createFilteredRaceListView: (
    races: Race[],
    distance: number
  ): CommandOutput => {
    if (races.length === 0) {
      return {
        text: raceMessages.errors.noRacesFoundForDistance(distance),
        format: 'HTML',
        editMessage: true,
        keyboard: {
          buttons: raceKeyboards.createBackToGeneralListButtons(),
          inline: true,
        },
      };
    }

    return {
      text: raceMessages.titles.racesForDistance(distance, races.length),
      format: 'HTML',
      editMessage: true,
      keyboard: {
        buttons: [
          ...raceKeyboards.createGeneralRaceListButtons(races),
          ...raceKeyboards.createBackToGeneralListButtons(),
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
