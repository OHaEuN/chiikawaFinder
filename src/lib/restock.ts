/**
 * 재입고 이력 읽기.
 *
 * 치이카와 마켓은 상품의 75%가 품절 상태로 남아 있고, 인기 상품은 여러 번 재입고된다.
 * 몇 번 들어왔는지보다 얼마 만에 한 번씩 들어오는지가 기다릴지 리셀로 살지를 가른다.
 */

/** 이 이상 재입고됐으면 정기적으로 다시 들어오는 상품으로 본다. */
const REPEAT_THRESHOLD = 3;

interface HasRestocks {
  restocks?: string[];
}

export interface RestockHint {
  tone: 'likely' | 'possible' | 'unknown';
  message: string;
}

export interface RestockCadence {
  count: number;
  /** 재입고 사이 평균 간격(일). 한 번만 들어왔으면 알 수 없다. */
  averageGapDays: number | null;
  firstDate: string;
  lastDate: string;
}

export const restockCount = (goods: HasRestocks) => goods.restocks?.length ?? 0;

export const lastRestock = (goods: HasRestocks) => goods.restocks?.at(-1);

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** 재입고 주기. 날짜가 두 개는 있어야 간격을 말할 수 있다. */
export function restockCadence(restocks: string[] | undefined): RestockCadence | null {
  if (!restocks?.length) return null;
  const dates = [...restocks].sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  return {
    count: dates.length,
    averageGapDays: dates.length < 2 ? null : Math.round(daysBetween(firstDate, lastDate) / (dates.length - 1)),
    firstDate,
    lastDate,
  };
}

export function restockHint(
  goods: HasRestocks & { available?: boolean },
  today = new Date().toISOString().slice(0, 10),
): RestockHint | null {
  if (goods.available !== false) return null;
  const cadence = restockCadence(goods.restocks);
  if (!cadence) {
    return { tone: 'unknown', message: '아직 재입고된 적이 없습니다. 다시 들어올지는 알 수 없습니다.' };
  }

  const elapsed = daysBetween(cadence.lastDate, today);
  const elapsedText = elapsed >= 0 ? ` 마지막 재입고는 ${elapsed}일 전입니다.` : '';
  const gapText = cadence.averageGapDays ? ` 평균 ${cadence.averageGapDays}일마다 한 번씩 들어왔습니다.` : '';

  if (cadence.count >= REPEAT_THRESHOLD) {
    return {
      tone: 'likely',
      message: `지금까지 ${cadence.count}번 재입고된 상품입니다. 정기적으로 다시 들어오는 편이라 기다려 볼 만합니다.${gapText}${elapsedText}`,
    };
  }
  return {
    tone: 'possible',
    message: `지금까지 ${cadence.count}번 재입고됐습니다. 다시 들어올 수 있습니다.${gapText}${elapsedText}`,
  };
}
