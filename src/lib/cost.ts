/**
 * 일본 직구 실구매가 계산.
 *
 * 공구 모집글은 "엔당 9.5원" 같은 적용 환율에 수수료를 섞어 적는다.
 * 실환율과 나란히 두면 그 차액이 드러난다. 이 모듈은 그 비교를 위한 계산만 한다.
 */

/** 치이카와 마켓 공식 안내: 1회 주문이 이 금액 이상이면 일본 내 배송 무료 */
export const FREE_DOMESTIC_SHIPPING_YEN = 11000;

export interface CartLine {
  id: string;
  name: string;
  /** 엔화 단가 */
  priceYen: number;
  quantity: number;
}

export interface CostInput {
  lines: CartLine[];
  /** 실제 시장 환율 (원/엔) */
  marketRate: number;
  /** 공구 주최자가 적용한 환율 (원/엔). 직접 직구면 실환율과 같게 둔다. */
  appliedRate: number;
  /** 해외배송비 총액 (원) */
  shippingKrw: number;
  /** 배송비를 나눠 낼 인원 */
  people: number;
  /** 국내 택배비 (원, 1인 부담) */
  domesticKrw: number;
}

export interface CostResult {
  /** 엔화 상품 합계 */
  subtotalYen: number;
  /** 무배컷까지 남은 금액 (엔). 이미 넘겼으면 0 */
  toFreeShippingYen: number;
  /** 적용 환율로 환산한 상품값 (원) */
  goodsKrw: number;
  /** 실환율로 환산한 상품값 (원) */
  goodsAtMarketKrw: number;
  /** 환율 차이로 더 내는 금액 (원). 실환율보다 싸게 적용하면 음수 */
  rateMarkupKrw: number;
  /** 상품값 대비 환율 마진 비율 (%) */
  rateMarkupPercent: number;
  /** 1인이 부담하는 해외배송비 (원) */
  shippingPerPersonKrw: number;
  /** 최종 1인 부담 총액 (원) */
  totalKrw: number;
}

const round = (value: number) => Math.round(value);

export function calculateCost(input: CostInput): CostResult {
  const { lines, marketRate, appliedRate, shippingKrw, people, domesticKrw } = input;

  const subtotalYen = lines.reduce((sum, l) => sum + l.priceYen * l.quantity, 0);
  const goodsKrw = round(subtotalYen * appliedRate);
  const goodsAtMarketKrw = round(subtotalYen * marketRate);
  const rateMarkupKrw = goodsKrw - goodsAtMarketKrw;
  // 사람 수가 0이나 음수로 들어와도 계산이 깨지지 않게 최소 1로 본다.
  const shippingPerPersonKrw = round(shippingKrw / Math.max(1, people));

  return {
    subtotalYen,
    toFreeShippingYen: Math.max(0, FREE_DOMESTIC_SHIPPING_YEN - subtotalYen),
    goodsKrw,
    goodsAtMarketKrw,
    rateMarkupKrw,
    rateMarkupPercent: goodsAtMarketKrw === 0 ? 0 : (rateMarkupKrw / goodsAtMarketKrw) * 100,
    shippingPerPersonKrw,
    totalKrw: goodsKrw + shippingPerPersonKrw + domesticKrw,
  };
}
