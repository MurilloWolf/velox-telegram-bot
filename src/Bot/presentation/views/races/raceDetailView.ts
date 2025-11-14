import { CommandOutput } from '../../../../types/Command.ts';
import { Race } from '../../../../types/Service.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';
import { RaceFormatter } from '../../../../utils/formatters/RaceFormatter.ts';

export const raceDetailView = {
  createRaceDetailView: (race: Race, uf?: string): CommandOutput => {
    let text = RaceFormatter.formatDetailedRaceMessage(race);

    // Adiciona link invisível para preview da imagem
    if (race.promoImageUrl) {
      text = `<a href="${race.promoImageUrl}">🖼️</a> ${text}`;
    }

    return {
      text,
      format: 'HTML',
      editMessage: true,
      keyboard: {
        inline: true,
        buttons: raceKeyboards.createRaceDetailButtons(race, uf),
      },
    };
  },

  createRaceNotFoundView: (): CommandOutput => ({
    text: raceMessages.errors.raceNotFound,
    format: 'HTML',
    editMessage: true,
  }),

  createErrorView: (): CommandOutput => ({
    text: raceMessages.errors.genericError,
    format: 'HTML',
    editMessage: true,
  }),
};
