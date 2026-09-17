import type { GoodsSummary } from '@/types/goods';

export interface ReleaseDay {
  date: string;
  /** 오늘로부터 며칠 뒤. 0이면 오늘 */
  daysAway: number;
  items: GoodsSummary[];
}

export const today = () => new Date().toISOString().slice(0, 10);

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** 앞으로 나올 굿즈를 발매일별로 묶는다. 지난 날짜는 버린다. */
export function upcomingReleases(goods: GoodsSummary[], from = today()): ReleaseDay[] {
  const byDate = new Map<string, GoodsSummary[]>();
  for (const item of goods) {
    if (item.releaseDate < from) continue;
    const bucket = byDate.get(item.releaseDate);
    if (bucket) bucket.push(item);
    else byDate.set(item.releaseDate, [item]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, daysAway: daysBetween(from, date), items }));
}

/** 최근 재입고. 공식몰이 재입고 목록을 전날 숨겨서, 팬들이 가장 못 찾는 정보다. */
export function recentRestocks(goods: GoodsSummary[], from = today(), windowDays = 30): ReleaseDay[] {
  const since = new Date(Date.parse(`${from}T00:00:00Z`) - windowDays * 86_400_000).toISOString().slice(0, 10);
  const byDate = new Map<string, GoodsSummary[]>();
  for (const item of goods) {
    const restocked = item.lastRestockDate;
    // 발매 자체가 최근이면 신상이지 재입고가 아니다.
    if (!restocked || restocked <= item.releaseDate || restocked < since || restocked > from) continue;
    const bucket = byDate.get(restocked);
    if (bucket) bucket.push(item);
    else byDate.set(restocked, [item]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, daysAway: -daysBetween(date, from), items }));
}

export const agoLabel = (daysAway: number) => (daysAway === 0 ? '오늘' : `${-daysAway}일 전`);

export const dDayLabel = (daysAway: number) => (daysAway === 0 ? '오늘' : `D-${daysAway}`);

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const koreanDate = (date: string) => {
  const [, month, day] = date.split('-');
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${Number(month)}월 ${Number(day)}일 (${weekday})`;
};
