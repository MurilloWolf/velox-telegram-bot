import { CommandOutput } from '../../../../types/Command.ts';
import { Race } from '../../../../types/Service.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';

export const raceListView = {
  createUfFilterView: (): CommandOutput => ({
    text: `${raceMessages.titles.raceList}\n\n${raceMessages.titles.ufFilter}`,
    format: 'HTML',
    keyboard: {
      inline: true,
      buttons: raceKeyboards.createUfFilterButtons(),
    },
  }),

  createRaceListView: (
    races: Race[],
    uf: string,
    editMessage = false
  ): CommandOutput => {
    if (races.length === 0) {
      return {
        text: raceMessages.errors.noRacesFound(uf),
        format: 'HTML',
        editMessage,
      };
    }

    return {
      text: raceMessages.titles.racesInState(uf, races.length),
      format: 'HTML',
      editMessage,
      keyboard: {
        inline: true,
        buttons: raceKeyboards.createRaceListButtons(races, uf),
      },
    };
  },

  createErrorView: (editMessage = false): CommandOutput => ({
    text: raceMessages.errors.genericError,
    format: 'HTML',
    editMessage,
  }),
};
