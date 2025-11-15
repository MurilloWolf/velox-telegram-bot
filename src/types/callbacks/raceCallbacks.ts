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

export type RaceCallbackData =
  | UfFilterCallbackData
  | RaceDetailCallbackData
  | RaceLocationCallbackData
  | DistanceFilterCallbackData;
