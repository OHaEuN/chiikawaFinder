export type OnlineCategory = 'manga' | 'anime' | 'video' | 'illustration' | 'sns' | 'game' | 'other';

export interface OnlineContent {
  id: string;
  category: OnlineCategory;
  title: string;
  platform: string;
  url: string;
  image?: string;
  description: string;
  region: 'KR' | 'JP' | 'GLOBAL';
  free: boolean;
  official: boolean;
  /** 올라와 있는 TV 시즌. 극장판이나 단편처럼 시즌이 없는 항목은 비운다. */
  seasons?: string[];
  /** 한국어 더빙인지 자막인지. 어디서 볼지 고를 때 가장 먼저 보는 조건이다. */
  audio?: 'dub' | 'sub' | 'both' | 'original';
}
