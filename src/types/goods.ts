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
  /**
   * 제휴 프로그램 대시보드에서 이 상품용으로 생성한 링크.
   * 쿠팡 파트너스·네이버 쇼핑커넥트·Buyee(Indoleads)는 기존 링크에 파라미터를 붙이는 방식이 아니라
   * 상품마다 링크를 따로 발급하므로, 발급받은 주소를 그대로 넣는다. 없으면 buyUrl 로 나간다.
   */
  affiliateUrl?: string;
  /** 지금 살 수 있는지. 치이카와 마켓은 상품 대부분이 품절 상태로 남아 있다. */
  available?: boolean;
  /** 지금까지 재입고된 횟수. 많을수록 또 들어올 가능성이 크다. */
  restockCount?: number;
  /** 마지막 재입고일 YYYY-MM-DD */
  lastRestockDate?: string;
  buyAt: string;
  country: 'KR' | 'JP' | 'GLOBAL';
  description: string;
  characters: string[];
  sources: string[];
}

/** 목록 화면에 내려보내는 축약형. 본문(description)·출처는 상세에서만 쓴다. */
export type GoodsSummary = Pick<
  Goods,
  'id' | 'name' | 'brand' | 'collab' | 'category' | 'releaseDate' | 'price' | 'image' | 'country' | 'available' | 'restockCount'
>;
