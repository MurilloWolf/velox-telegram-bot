import { CommandOutput } from '../../../../types/Command.ts';
import { Race } from '../../../../types/Service.ts';
import { raceMessages } from '../../messages/races/raceMessages.ts';
import { raceKeyboards } from '../../keyboards/races/raceKeyboards.ts';

export const distanceFilterView = {
  createDistanceFilterView: (uf: 'SP' | 'PR'): CommandOutput => ({
    text: raceMessages.titles.distanceFilter(uf),
    format: 'HTML',
    editMessage: true,
    keyboard: {
      buttons: raceKeyboards.createDistanceFilterButtons(uf),
      inline: true,
    },
  }),

  createFilteredRacesView: (
    races: Race[],
    uf: string,
    distance: string
  ): CommandOutput => ({
    text: raceMessages.createFilteredRacesMessage(races, uf, distance),
    format: 'HTML',
    editMessage: true,
    keyboard: {
      buttons: [
        ...raceKeyboards.createRaceListButtons(races, uf),
        ...raceKeyboards.createDistanceFilterNavigationButtons(uf),
      ],
      inline: true,
    },
  }),

  createNoRacesFoundView: (uf: string, distance: string): CommandOutput => ({
    text: raceMessages.createNoRacesFoundMessage(uf, distance),
    format: 'HTML',
    editMessage: true,
    keyboard: {
      buttons: raceKeyboards.createBackToUfFilterButtons(uf),
      inline: true,
    },
  }),

  createErrorView: (): CommandOutput => ({
    text: '❌ Erro ao filtrar corridas por distância. Tente novamente.',
    format: 'HTML',
    editMessage: true,
  }),
};
