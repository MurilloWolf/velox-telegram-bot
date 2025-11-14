export interface BaseCallbackData {
  type: string;
}

export interface UfFilterCallbackData extends BaseCallbackData {
  type: 'uf_filter';
  uf: 'SP' | 'PR';
}

export type RaceCallbackData = UfFilterCallbackData;
