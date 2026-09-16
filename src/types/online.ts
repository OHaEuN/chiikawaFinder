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
}
