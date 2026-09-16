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

export const dDayLabel = (daysAway: number) => (daysAway === 0 ? '오늘' : `D-${daysAway}`);

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const koreanDate = (date: string) => {
  const [, month, day] = date.split('-');
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${Number(month)}월 ${Number(day)}일 (${weekday})`;
};
