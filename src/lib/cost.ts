/**
 * 일본 직구 실구매가 계산.
 *
 * 공구 모집글은 "엔당 9.5원" 같은 적용 환율에 수수료를 섞어 적는다.
 * 실환율과 나란히 두면 그 차액이 드러난다. 이 모듈은 그 비교를 위한 계산만 한다.
 */

/** 치이카와 마켓 공식 안내: 1회 주문이 이 금액 이상이면 일본 내 배송 무료 */
export const FREE_DOMESTIC_SHIPPING_YEN = 11000;

/**
 * 무배컷에 못 미칠 때 붙는 일본 내 배송료. 배대지가 몰려 있는 関東·中部 요금이다.
 * 近畿 1,045 / 東北·中国·四国 1,100 / 北海道·九州 1,320 / 沖縄 4,070 이라 지역마다 다르다.
 */
export const DOMESTIC_JP_SHIPPING_YEN = 990;

/**
 * 일본발 해외직구 소액면세 한도(미국 달러). 이 금액을 넘으면 초과분이 아니라 전체가 과세된다.
 * 근거는 docs/import-cost.md 참고.
 */
export const DUTY_FREE_LIMIT_USD = 150;

/**
 * 면세 한도 판정에 쓰는 물품가격에는 국제운임이 들어가지 않지만,
 * 한도를 넘겨 실제로 과세할 때의 과세가격에는 국제운임이 들어간다. 이 비대칭을 지켜야 한다.
 */
export const TAX_RATES = {
  toy: { label: '인형 · 문구 · 잡화', duty: 0.08 },
  apparel: { label: '의류', duty: 0.13 },
} as const;

export type TaxCategory = keyof typeof TAX_RATES;

/** 부가가치세. 관세를 더한 금액에 다시 붙는다. */
const VAT_RATE = 0.1;

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
  /** 원/달러 환산용. 엔 1단위당 달러 */
  usdPerJpy: number;
  /** 과세 품목 구분 */
  taxCategory: TaxCategory;
}

export interface CustomsResult {
  /** 면세 한도 판정에 쓰는 물품가격 (달러). 국제운임은 빼고 본다. */
  goodsValueUsd: number;
  /** 면세 한도까지 남은 금액 (엔). 넘겼으면 0 */
  toLimitYen: number;
  /** 한도를 넘겨 과세 대상인지 */
  taxable: boolean;
  /** 예상 관세 (원) */
  dutyKrw: number;
  /** 예상 부가세 (원) */
  vatKrw: number;
  /** 관세 + 부가세 (원) */
  totalTaxKrw: number;
}

export interface CostResult {
  /** 엔화 상품 합계 */
  subtotalYen: number;
  /** 일본 내 배송료 (엔). 무배컷을 넘기면 0 */
  domesticJpYen: number;
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
  /** 통관 예상 */
  customs: CustomsResult;
  /** 최종 1인 부담 총액 (원). 배송비만 나눠 내고 상품값과 세금은 내 몫 전액이다. */
  totalKrw: number;
}

const round = (value: number) => Math.round(value);

export function calculateCost(input: CostInput): CostResult {
  const { lines, marketRate, appliedRate, shippingKrw, people, domesticKrw, usdPerJpy, taxCategory } = input;

  const subtotalYen = lines.reduce((sum, l) => sum + l.priceYen * l.quantity, 0);
  // 무배컷에 못 미치면 일본 안에서 배대지까지 보내는 값이 따로 든다.
  const domesticJpYen =
    subtotalYen > 0 && subtotalYen < FREE_DOMESTIC_SHIPPING_YEN ? DOMESTIC_JP_SHIPPING_YEN : 0;
  // 일본 내 운임은 면세 한도 판정용 물품가격에 들어간다. 국제운임과 달리 제외 대상이 아니다.
  const customs = calculateCustoms({
    subtotalYen: subtotalYen + domesticJpYen,
    shippingKrw,
    marketRate,
    usdPerJpy,
    taxCategory,
  });
  const goodsKrw = round((subtotalYen + domesticJpYen) * appliedRate);
  const goodsAtMarketKrw = round((subtotalYen + domesticJpYen) * marketRate);
  const rateMarkupKrw = goodsKrw - goodsAtMarketKrw;
  // 사람 수가 0이나 음수로 들어와도 계산이 깨지지 않게 최소 1로 본다.
  const shippingPerPersonKrw = round(shippingKrw / Math.max(1, people));

  return {
    subtotalYen,
    domesticJpYen,
    toFreeShippingYen: Math.max(0, FREE_DOMESTIC_SHIPPING_YEN - subtotalYen),
    goodsKrw,
    goodsAtMarketKrw,
    rateMarkupKrw,
    rateMarkupPercent: goodsAtMarketKrw === 0 ? 0 : (rateMarkupKrw / goodsAtMarketKrw) * 100,
    shippingPerPersonKrw,
    customs,
    // 세금은 내 장바구니에 매겨진 값이라 인원수로 나누지 않는다. 배송비만 나눠 낸다.
    totalKrw: goodsKrw + shippingPerPersonKrw + domesticKrw + customs.totalTaxKrw,
  };
}

interface CustomsInput {
  subtotalYen: number;
  shippingKrw: number;
  marketRate: number;
  usdPerJpy: number;
  taxCategory: TaxCategory;
}

/**
 * 면세 한도 판정과 세액 계산.
 *
 * 한도 판정은 국제운임을 뺀 물품가격으로 하고, 실제 과세는 국제운임을 더한 과세가격에 한다.
 * 한도를 넘으면 초과분이 아니라 전체 금액에 세금이 붙는다.
 */
export function calculateCustoms({ subtotalYen, shippingKrw, marketRate, usdPerJpy, taxCategory }: CustomsInput): CustomsResult {
  const goodsValueUsd = subtotalYen * usdPerJpy;
  const limitYen = usdPerJpy > 0 ? DUTY_FREE_LIMIT_USD / usdPerJpy : Infinity;
  const taxable = goodsValueUsd > DUTY_FREE_LIMIT_USD;

  if (!taxable) {
    return {
      goodsValueUsd,
      toLimitYen: Math.max(0, Math.round(limitYen - subtotalYen)),
      taxable: false,
      dutyKrw: 0,
      vatKrw: 0,
      totalTaxKrw: 0,
    };
  }

  const dutiableKrw = subtotalYen * marketRate + shippingKrw;
  const dutyKrw = round(dutiableKrw * TAX_RATES[taxCategory].duty);
  const vatKrw = round((dutiableKrw + dutyKrw) * VAT_RATE);

  return {
    goodsValueUsd,
    toLimitYen: 0,
    taxable: true,
    dutyKrw,
    vatKrw,
    totalTaxKrw: dutyKrw + vatKrw,
  };
}
