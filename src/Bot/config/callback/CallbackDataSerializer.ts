import {
  CallbackData,
  NavigationCallbackData,
  UfFilterCallbackData,
  RaceDetailCallbackData,
  RaceLocationCallbackData,
  DistanceFilterCallbackData,
  RaceRegistrationCallbackData,
  RaceFavoriteCallbackData,
  RaceUnfavoriteCallbackData,
  RaceDetailsCallbackData,
  RaceListCallbackData,
  RacesListFavoriteCallbackData,
  RaceFilterCallbackData,
} from '../../../types/callbacks/index.ts';

export class CallbackDataSerializer {
  static serialize(data: CallbackData): string {
    switch (data.type) {
      case 'navigation': {
        const navData = data as NavigationCallbackData;
        return `nav:${navData.action}:${navData.target || ''}`;
      }
      case 'uf_filter': {
        const filterData = data as UfFilterCallbackData;
        return `uf:${filterData.uf}`;
      }
      case 'distance_filter': {
        const distanceData = data as DistanceFilterCallbackData;
        return `dist:${distanceData.uf}:${distanceData.distance}`;
      }
      case 'race_detail': {
        const detailData = data as RaceDetailCallbackData;
        return `race:${detailData.raceId}${detailData.uf ? `:${detailData.uf}` : ''}`;
      }
      case 'race_location': {
        const locationData = data as RaceLocationCallbackData;
        return `location:${locationData.raceId}${locationData.uf ? `:${locationData.uf}` : ''}`;
      }
      case 'race_registration': {
        const registrationData = data as RaceRegistrationCallbackData;
        return `registration:${registrationData.raceId}${registrationData.uf ? `:${registrationData.uf}` : ''}`;
      }
      case 'race_favorite': {
        const favoriteData = data as RaceFavoriteCallbackData;
        return `fav:${favoriteData.raceId}`;
      }
      case 'race_unfavorite': {
        const unfavoriteData = data as RaceUnfavoriteCallbackData;
        return `unfav:${unfavoriteData.raceId}`;
      }
      case 'race_details': {
        const detailsData = data as RaceDetailsCallbackData;
        return `details:${detailsData.raceId}${detailsData.source ? `:${detailsData.source}` : ''}`;
      }
      case 'races_list': {
        const listData = data as RaceListCallbackData;
        return `list${listData.distance ? `:${listData.distance}` : ''}`;
      }
      case 'races_list_favorite': {
        return 'listfav';
      }
      case 'races_filter': {
        const filterData = data as RaceFilterCallbackData;
        return `filter:${filterData.distance}`;
      }
      default: {
        const unknownData = data as { type: string };
        throw new Error(`Tipo de callback não suportado: ${unknownData.type}`);
      }
    }
  }

  static deserialize(serialized: string): CallbackData {
    const parts = serialized.split(':');
    const prefix = parts[0];

    switch (prefix) {
      case 'nav': {
        return {
          type: 'navigation',
          action: parts[1] as 'back' | 'next' | 'close',
          target: parts[2] || '',
        } as NavigationCallbackData;
      }
      case 'uf': {
        return {
          type: 'uf_filter',
          uf: parts[1] as 'SP' | 'PR',
        } as UfFilterCallbackData;
      }
      case 'dist': {
        return {
          type: 'distance_filter',
          uf: parts[1] as 'SP' | 'PR',
          distance: parts[2] as 'ALL' | '5K-9K' | '10K-21K' | '42K',
        } as DistanceFilterCallbackData;
      }
      case 'race': {
        return {
          type: 'race_detail',
          raceId: parts[1],
          uf: parts[2] || undefined,
        } as RaceDetailCallbackData;
      }
      case 'location': {
        return {
          type: 'race_location',
          raceId: parts[1],
          uf: parts[2] || undefined,
        } as RaceLocationCallbackData;
      }
      case 'registration': {
        return {
          type: 'race_registration',
          raceId: parts[1],
          uf: parts[2] || undefined,
        } as RaceRegistrationCallbackData;
      }
      case 'fav': {
        return {
          type: 'race_favorite',
          raceId: parts[1],
        } as RaceFavoriteCallbackData;
      }
      case 'unfav': {
        return {
          type: 'race_unfavorite',
          raceId: parts[1],
        } as RaceUnfavoriteCallbackData;
      }
      case 'details': {
        return {
          type: 'race_details',
          raceId: parts[1],
          source: parts[2] || undefined,
        } as RaceDetailsCallbackData;
      }
      case 'list': {
        return {
          type: 'races_list',
          distance: parts[1] ? parseInt(parts[1]) : undefined,
        } as RaceListCallbackData;
      }
      case 'listfav': {
        return {
          type: 'races_list_favorite',
        } as RacesListFavoriteCallbackData;
      }
      case 'filter': {
        return {
          type: 'races_filter',
          distance: parseInt(parts[1]),
        } as RaceFilterCallbackData;
      }
      default:
        throw new Error(`Prefixo de callback não reconhecido: ${prefix}`);
    }
  }

  static validateSize(data: CallbackData): boolean {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8') <= 64;
  }

  static getSize(data: CallbackData): number {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8');
  }

  static navigation(
    action: 'back' | 'next' | 'close',
    target?: string
  ): NavigationCallbackData {
    return { type: 'navigation', action, target: target || '' };
  }

  static ufFilter(uf: 'SP' | 'PR'): UfFilterCallbackData {
    return { type: 'uf_filter', uf };
  }

  static raceDetail(raceId: string, uf?: string): RaceDetailCallbackData {
    return { type: 'race_detail', raceId, uf };
  }

  static raceLocation(raceId: string, uf?: string): RaceLocationCallbackData {
    return { type: 'race_location', raceId, uf };
  }

  static distanceFilter(
    uf: 'SP' | 'PR',
    distance: 'ALL' | '5K-9K' | '10K-21K' | '42K'
  ): DistanceFilterCallbackData {
    return { type: 'distance_filter', uf, distance };
  }

  static raceRegistration(
    raceId: string,
    uf?: string
  ): RaceRegistrationCallbackData {
    return { type: 'race_registration', raceId, uf };
  }

  static raceFavorite(raceId: string): RaceFavoriteCallbackData {
    return { type: 'race_favorite', raceId };
  }

  static raceUnfavorite(raceId: string): RaceUnfavoriteCallbackData {
    return { type: 'race_unfavorite', raceId };
  }

  static raceDetails(raceId: string, source?: string): RaceDetailsCallbackData {
    return { type: 'race_details', raceId, source };
  }

  static racesList(distance?: number): RaceListCallbackData {
    return { type: 'races_list', distance };
  }

  static racesListFavorite(): RacesListFavoriteCallbackData {
    return { type: 'races_list_favorite' };
  }

  static racesFilter(distance: number): RaceFilterCallbackData {
    return { type: 'races_filter', distance };
  }
}
