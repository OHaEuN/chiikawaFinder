export type GroupBuyChannelKind = 'form' | 'cafe' | 'market' | 'twitter' | 'openchat';

/** 결제 보호 수준. 개인 간 계좌이체만 가능한 곳일수록 위험하다. */
export type GroupBuySafety = 'safer' | 'caution' | 'risky';

/** 공구가 열리는 곳. 개별 주최자가 아니라 플랫폼 단위로 모은다. */
export interface GroupBuyChannel {
  id: string;
  name: string;
  kind: GroupBuyChannelKind;
  url?: string;
  description: string;
  safety: GroupBuySafety;
  safetyNote: string;
  sources: string[];
}
