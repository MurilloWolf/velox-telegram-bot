import { InteractionButton } from '../../../../types/Command.ts';
import { CallbackDataSerializer } from '../../../config/callback/CallbackDataSerializer.ts';
import { Race } from '../../../../types/Service.ts';
import { FavoriteRace } from '../../../../services/index.ts';
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

  createRaceDetailButtons: (
    race: Race,
    uf?: string,
    isFavorited?: boolean
  ): InteractionButton[][] => {
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

    // Adicionar botão de favorito/desfavoritar
    const favoriteButton: InteractionButton = isFavorited
      ? {
          text: '💔 Desfavoritar',
          callbackData: CallbackDataSerializer.raceUnfavorite(race.id),
        }
      : {
          text: '❤️ Favoritar',
          callbackData: CallbackDataSerializer.raceFavorite(race.id),
        };

    buttons.push([favoriteButton]);

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

  // Keyboards para listagem geral de corridas (sem filtro de UF)
  createGeneralRaceListButtons: (races: Race[]): InteractionButton[][] =>
    races.slice(0, 10).map(race => [
      {
        text: `🏃‍♂️ ${race.title} - ${race.distances.join('/')}`,
        callbackData: CallbackDataSerializer.raceDetails(race.id),
      },
    ]),

  createGeneralRaceFilterButtons: (): InteractionButton[][] => [
    [
      { text: '5km', callbackData: CallbackDataSerializer.racesFilter(5) },
      { text: '10km', callbackData: CallbackDataSerializer.racesFilter(10) },
      { text: '21km', callbackData: CallbackDataSerializer.racesFilter(21) },
    ],
    [
      { text: '42km', callbackData: CallbackDataSerializer.racesFilter(42) },
      { text: '📋 Todas', callbackData: CallbackDataSerializer.racesList() },
      {
        text: '⭐ Favoritas',
        callbackData: CallbackDataSerializer.racesListFavorite(),
      },
    ],
  ],

  createGeneralRaceListNavigationButtons: (): InteractionButton[][] => [
    [
      {
        text: '⭐ Ver Favoritas',
        callbackData: CallbackDataSerializer.racesListFavorite(),
      },
    ],
  ],

  createBackToGeneralListButtons: (): InteractionButton[][] => [
    [
      {
        text: '⬅️ Voltar',
        callbackData: CallbackDataSerializer.racesList(),
      },
    ],
  ],

  // Keyboards para corridas favoritas
  createFavoriteRaceListButtons: (
    races: FavoriteRace[]
  ): InteractionButton[][] =>
    races.slice(0, 10).map(race => [
      {
        text: `🏃‍♂️ ${race.title} - ${race.distances.join('/')}`,
        callbackData: CallbackDataSerializer.raceDetails(race.id),
      },
    ]),

  createNavigationToAllRacesButtons: (): InteractionButton[][] => [
    [
      {
        text: '🏃‍♂️ Ver Todas as Corridas',
        callbackData: CallbackDataSerializer.racesList(),
      },
    ],
  ],
};
