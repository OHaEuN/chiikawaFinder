import type { GoodsSummary } from '@/types/goods';

export type StockState = 'upcoming' | 'available' | 'soldout' | 'unknown';

/**
 * 재고 상태.
 *
 * 아직 발매 전인 상품도 살 수 없는 상태로 들어오는데, 그걸 품절이라고 하면 틀린 말이 된다.
 * 발매일이 아직 오지 않았으면 발매 예정으로 본다.
 */
export function stockState(
  goods: Pick<GoodsSummary, 'available' | 'releaseDate'>,
  today = new Date().toISOString().slice(0, 10),
): StockState {
  if (goods.releaseDate > today) return 'upcoming';
  if (goods.available === true) return 'available';
  if (goods.available === false) return 'soldout';
  return 'unknown';
}

export const STOCK_LABEL: Record<StockState, string | null> = {
  upcoming: '발매 예정',
  available: null,
  soldout: '품절',
  unknown: null,
};
