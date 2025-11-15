export interface BaseCallbackData {
  type: string;
}

export interface UfFilterCallbackData extends BaseCallbackData {
  type: 'uf_filter';
  uf: 'SP' | 'PR';
}

export interface RaceDetailCallbackData extends BaseCallbackData {
  type: 'race_detail';
  raceId: string;
  uf?: string;
}

export interface RaceLocationCallbackData extends BaseCallbackData {
  type: 'race_location';
  raceId: string;
  uf?: string;
}

export interface DistanceFilterCallbackData extends BaseCallbackData {
  type: 'distance_filter';
  uf: 'SP' | 'PR';
  distance: 'ALL' | '5K-9K' | '10K-21K' | '42K';
}

export interface RaceRegistrationCallbackData extends BaseCallbackData {
  type: 'race_registration';
  raceId: string;
  uf?: string;
}

export interface RaceFavoriteCallbackData extends BaseCallbackData {
  type: 'race_favorite';
  raceId: string;
}

export interface RaceUnfavoriteCallbackData extends BaseCallbackData {
  type: 'race_unfavorite';
  raceId: string;
}

export interface RaceDetailsCallbackData extends BaseCallbackData {
  type: 'race_details';
  raceId: string;
  source?: string;
}

export interface RaceListCallbackData extends BaseCallbackData {
  type: 'races_list';
  distance?: number;
}

export interface RacesListFavoriteCallbackData extends BaseCallbackData {
  type: 'races_list_favorite';
}

export interface RaceFilterCallbackData extends BaseCallbackData {
  type: 'races_filter';
  distance: number;
}

export type RaceCallbackData =
  | UfFilterCallbackData
  | RaceDetailCallbackData
  | RaceLocationCallbackData
  | DistanceFilterCallbackData
  | RaceRegistrationCallbackData
  | RaceFavoriteCallbackData
  | RaceUnfavoriteCallbackData
  | RaceDetailsCallbackData
  | RaceListCallbackData
  | RacesListFavoriteCallbackData
  | RaceFilterCallbackData;
