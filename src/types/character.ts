export interface EpisodeAppearance {
  season: number;
  episode: number;
  title: string;
  note?: string;
}

export interface CharacterRelation {
  slug: string;
  relation: string;
}

export interface Character {
  slug: string;
  name: string;
  nameJa: string;
  nameEn: string;
  group: '주인공' | '주요 인물' | '조연' | '적/괴물' | '기타';
  species: string;
  image: string;
  tagline: string;
  description: string[];
  traits: string[];
  relationships: CharacterRelation[];
  firstAppearance: { manga?: string; anime?: string };
  episodes: EpisodeAppearance[];
  trivia: string[];
  sources: string[];
}
