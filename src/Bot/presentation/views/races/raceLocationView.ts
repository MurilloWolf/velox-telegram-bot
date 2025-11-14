import { CommandOutput } from '../../../../types/Command.ts';
import { Race } from '../../../../types/Service.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';

export const raceLocationView = {
  createRaceLocationView: (race: Race, uf?: string): CommandOutput => {
    if (!race.latitude || !race.longitude) {
      return {
        text: raceMessages.errors.noLocation,
        format: 'HTML',
        editMessage: true,
      };
    }

    return {
      text: raceMessages.success.raceLocation(
        race.title,
        race.location,
        race.city
      ),
      format: 'HTML',
      editMessage: true,
      location: {
        latitude: race.latitude,
        longitude: race.longitude,
      },
      keyboard: {
        inline: true,
        buttons: raceKeyboards.createRaceLocationButtons(race.id, uf),
      },
    };
  },

  createRaceNotFoundView: (): CommandOutput => ({
    text: raceMessages.errors.raceNotFound,
    format: 'HTML',
    editMessage: true,
  }),

  createErrorView: (): CommandOutput => ({
    text: raceMessages.errors.locationError,
    format: 'HTML',
    editMessage: true,
  }),
};
