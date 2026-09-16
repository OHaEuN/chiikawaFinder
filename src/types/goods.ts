export interface Goods {
  id: string;
  name: string;
  brand: string;
  collab?: string;
  category: string;
  releaseDate: string;
  price: string;
  image?: string;
  buyUrl: string;
  buyAt: string;
  country: 'KR' | 'JP' | 'GLOBAL';
  description: string;
  characters: string[];
  sources: string[];
}

/** 목록 화면에 내려보내는 축약형. 본문(description)·출처는 상세에서만 쓴다. */
export type GoodsSummary = Pick<
  Goods,
  'id' | 'name' | 'brand' | 'collab' | 'category' | 'releaseDate' | 'price' | 'image' | 'country'
>;
