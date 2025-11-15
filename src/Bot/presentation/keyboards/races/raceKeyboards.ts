import { InteractionButton } from '../../../../types/Command.ts';
import { CallbackDataSerializer } from '../../../config/callback/CallbackDataSerializer.ts';
import { Race } from '../../../../types/Service.ts';
import { getUfFullName } from '../../messages/races/raceMessages.ts';

export const raceKeyboards = {
  createUfFilterButtons: (): InteractionButton[][] => [
    [
      {
        text: `São Paulo (SP)`,
        callbackData: CallbackDataSerializer.ufFilter('SP'),
      },
      {
        text: `Paraná (PR)`,
        callbackData: CallbackDataSerializer.ufFilter('PR'),
      },
    ],
  ],

  createDistanceFilterButtons: (uf: 'SP' | 'PR'): InteractionButton[][] => [
    [
      {
        text: '📋 TODAS',
        callbackData: CallbackDataSerializer.distanceFilter(uf, 'ALL'),
      },
    ],
    [
      {
        text: '🏃‍♂️ 5km ~ 9km',
        callbackData: CallbackDataSerializer.distanceFilter(uf, '5K-9K'),
      },
    ],
    [
      {
        text: '🏃‍♂️ 10km ~ 21km',
        callbackData: CallbackDataSerializer.distanceFilter(uf, '10K-21K'),
      },
    ],
    [
      {
        text: '🏃‍♂️ 42km (Maratona)',
        callbackData: CallbackDataSerializer.distanceFilter(uf, '42K'),
      },
    ],
    [
      {
        text: '⬅️ Voltar aos Estados',
        callbackData: CallbackDataSerializer.navigation('back', 'uf_filter'),
      },
    ],
  ],

  createBackToUfFilterButtons: (uf: string): InteractionButton[][] => [
    [
      {
        text: '🔄 Outras Distâncias',
        callbackData: CallbackDataSerializer.ufFilter(uf as 'SP' | 'PR'),
      },
    ],
    [
      {
        text: '⬅️ Voltar aos Estados',
        callbackData: CallbackDataSerializer.navigation('back', 'uf_filter'),
      },
    ],
  ],

  createDistanceFilterNavigationButtons: (
    uf: string
  ): InteractionButton[][] => [
    [
      {
        text: '🔄 Outras Distâncias',
        callbackData: CallbackDataSerializer.ufFilter(uf as 'SP' | 'PR'),
      },
    ],
    [
      {
        text: '⬅️ Voltar aos Estados',
        callbackData: CallbackDataSerializer.navigation('back', 'uf_filter'),
      },
    ],
  ],

  createRaceListButtons: (races: Race[], uf: string): InteractionButton[][] =>
    races.map(race => [
      {
        text: `🏃‍♂️ ${race.title}`,
        callbackData: CallbackDataSerializer.raceDetail(race.id, uf),
      },
    ]),

  createRaceDetailButtons: (race: Race, uf?: string): InteractionButton[][] => {
    const buttons: InteractionButton[][] = [];

    const mainActions: InteractionButton[] = [
      {
        text: '🔗 Abrir Inscrições',
        callbackData: CallbackDataSerializer.raceRegistration(race.id, uf),
      },
    ];

    if (race.latitude && race.longitude) {
      mainActions.push({
        text: '📍 Ver Localização',
        callbackData: CallbackDataSerializer.raceLocation(race.id, uf),
      });
    }

    buttons.push(mainActions);

    if (uf && (uf === 'SP' || uf === 'PR')) {
      buttons.push([
        {
          text: `⬅️ Voltar para ${getUfFullName(uf)}`,
          callbackData: CallbackDataSerializer.ufFilter(uf),
        },
      ]);
    }

    return buttons;
  },

  createRaceLocationButtons: (
    raceId: string,
    uf?: string
  ): InteractionButton[][] => [
    [
      {
        text: '⬅️ Voltar aos Detalhes',
        callbackData: CallbackDataSerializer.raceDetail(raceId, uf),
      },
    ],
  ],
};
