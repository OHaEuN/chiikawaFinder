import type { History, HistoryDay } from '@/types/history';
import type { GoodsSummary } from '@/types/goods';
import { daysBetween } from './restock.ts';

/**
 * 매일 긁어 쌓은 기록을 화면이 쓸 수 있는 모양으로 바꾼다.
 *
 * 상품값은 엔화로 고정돼 있어 좀처럼 바뀌지 않는다. 한국 사람이 실제로 내는 돈이 움직이는 건
 * 거의 환율 때문이다. 그래서 상품마다 원화를 따로 적지 않고, 날짜별 환율 하나로 전부 환산한다.
 */

export interface FxPoint {
  date: string;
  krwPerJpy: number;
}

export interface FxVerdict {
  today: FxPoint;
  min: FxPoint;
  max: FxPoint;
  /** 기록을 시작한 날 대비 변화율(%). 음수면 엔이 싸졌다는 뜻이다. */
  changePercent: number;
  /** 기록 중 오늘보다 쌌던 날 수 */
  cheaperDays: number;
  total: number;
  tone: 'good' | 'bad' | 'mid';
  message: string;
}

/** 환율을 못 받아온 날은 그래프를 끊지 말고 빼 둔다. */
export const fxSeries = (history: History): FxPoint[] =>
  history.days.filter((d) => d.krwPerJpy > 0).map((d) => ({ date: d.date, krwPerJpy: d.krwPerJpy }));

/** 오늘 환율이 기록 안에서 어느 쯤인지. 3분의 1 안에 들면 살 만한 때로 본다. */
const GOOD_PERCENTILE = 1 / 3;

export function fxVerdict(series: FxPoint[]): FxVerdict | null {
  if (series.length < 2) return null;
  const today = series[series.length - 1];
  const sorted = [...series].sort((a, b) => a.krwPerJpy - b.krwPerJpy);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const cheaperDays = series.filter((p) => p.krwPerJpy < today.krwPerJpy).length;
  const changePercent = ((today.krwPerJpy - series[0].krwPerJpy) / series[0].krwPerJpy) * 100;
  const ratio = cheaperDays / (series.length - 1);

  const tone = ratio <= GOOD_PERCENTILE ? 'good' : ratio >= 1 - GOOD_PERCENTILE ? 'bad' : 'mid';
  const span = daysBetween(series[0].date, today.date);
  const moved = `${span}일 전보다 엔이 ${Math.abs(changePercent).toFixed(1)}% ${changePercent < 0 ? '싸졌습니다' : '비싸졌습니다'}.`;
  const rank =
    cheaperDays === 0
      ? '기록한 날 중 가장 쌉니다.'
      : tone === 'good'
        ? `기록한 ${series.length}일 중 ${cheaperDays + 1}번째로 쌉니다.`
        : tone === 'bad'
          ? `기록한 ${series.length}일 중 비싼 편입니다.`
          : `기록한 ${series.length}일의 중간쯤입니다.`;

  return { today, min, max, changePercent, cheaperDays, total: series.length, tone, message: `${moved} ${rank}` };
}

export type GoodsEventKind = 'release' | 'restock' | 'soldout' | 'instock';

export interface GoodsEvent {
  date: string;
  kind: GoodsEventKind;
}

export const EVENT_LABEL: Record<GoodsEventKind, string> = {
  release: '발매',
  restock: '재입고',
  soldout: '품절',
  instock: '다시 구매 가능',
};

/**
 * 상품 하나의 이력.
 *
 * 발매일과 재입고일은 공식 상품 태그에서 오고, 품절·재개는 우리가 매일 본 것에서 온다.
 * 같은 날 태그의 재입고와 우리가 본 재개가 겹치면 공식 쪽 말을 남긴다.
 */
export function goodsTimeline(
  history: History,
  goods: Pick<GoodsSummary, 'id' | 'releaseDate' | 'restocks'>,
): GoodsEvent[] {
  const events: GoodsEvent[] = [{ date: goods.releaseDate, kind: 'release' }];
  const restocked = new Set(goods.restocks ?? []);
  restocked.forEach((date) => events.push({ date, kind: 'restock' }));

  for (const day of history.days) {
    if (day.soldOut.includes(goods.id)) events.push({ date: day.date, kind: 'soldout' });
    if (day.backInStock.includes(goods.id) && !restocked.has(day.date)) {
      events.push({ date: day.date, kind: 'instock' });
    }
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 다시 들어온 뒤 품절되기까지 걸린 날. 기록 안에서 둘 다 본 경우만 센다.
 * 발매 당일 품절되는 상품인지 며칠 버티는지가 알림을 켤지 말지를 가른다.
 */
export function sellOutDays(timeline: GoodsEvent[]): number[] {
  const ascending = [...timeline].sort((a, b) => a.date.localeCompare(b.date));
  const spans: number[] = [];
  let openedAt: string | null = null;

  for (const event of ascending) {
    if (event.kind === 'restock' || event.kind === 'instock') openedAt = event.date;
    else if (event.kind === 'soldout' && openedAt) {
      spans.push(daysBetween(openedAt, event.date));
      openedAt = null;
    }
  }
  return spans;
}

export interface DayChange {
  date: string;
  krwPerJpy: number;
  added: GoodsSummary[];
  soldOut: GoodsSummary[];
  backInStock: GoodsSummary[];
}

export const changeCount = (day: DayChange) => day.added.length + day.soldOut.length + day.backInStock.length;

/**
 * id 목록을 실제 상품으로 바꾼다.
 * 6개월 창에서 빠져나간 상품은 더 이상 보여 줄 내용이 없어 지나친다.
 */
export function resolveDay(day: HistoryDay, byId: Map<string, GoodsSummary>): DayChange {
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((g): g is GoodsSummary => Boolean(g));
  return {
    date: day.date,
    krwPerJpy: day.krwPerJpy,
    added: pick(day.added),
    soldOut: pick(day.soldOut),
    backInStock: pick(day.backInStock),
  };
}

/** 최근 기록부터. 아무것도 안 바뀐 날은 빼고 보여 준다. */
export function recentChanges(history: History, byId: Map<string, GoodsSummary>, limit = 14): DayChange[] {
  return [...history.days]
    .reverse()
    .map((day) => resolveDay(day, byId))
    .filter((day) => changeCount(day) > 0)
    .slice(0, limit);
}
