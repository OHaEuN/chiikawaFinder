export type GroupBuyStatus = 'open' | 'closed' | 'shipping' | 'done';

export type GroupBuyChannel = 'twitter' | 'cafe' | 'openchat' | 'instagram' | 'store' | 'other';

export interface GroupBuy {
  id: string;
  /** 공구 상품 또는 묶음 이름 */
  title: string;
  /** 주최자 표시명 */
  organizer: string;
  channel: GroupBuyChannel;
  /** 참여·안내 링크 */
  url: string;
  image?: string;
  status: GroupBuyStatus;
  /** 마감일 YYYY-MM-DD */
  deadline?: string;
  /** 예: "상품가의 10%" */
  fee?: string;
  /** 예: "인당 배송비 분담, 약 3,000~5,000원" */
  shipping?: string;
  /** 다루는 상품 */
  items: string[];
  description: string;
  sources: string[];
}
