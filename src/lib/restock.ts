/**
 * 재입고 가능성 안내.
 *
 * 치이카와 마켓은 상품의 79%가 품절 상태로 남아 있고, 인기 상품은 여러 번 재입고된다.
 * 재입고 이력이 쌓인 상품은 또 들어올 가능성이 있어, 기다릴지 리셀로 살지 판단에 쓴다.
 */

/** 이 이상 재입고됐으면 정기적으로 다시 들어오는 상품으로 본다. */
const REPEAT_THRESHOLD = 3;

export interface RestockHint {
  tone: 'likely' | 'possible' | 'unknown';
  message: string;
}

const daysSince = (date: string, today: string) =>
  Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);

export function restockHint(
  restockCount: number | undefined,
  lastRestockDate: string | undefined,
  available: boolean | undefined,
  today = new Date().toISOString().slice(0, 10),
): RestockHint | null {
  if (available !== false) return null;
  if (!restockCount) {
    return { tone: 'unknown', message: '재입고된 적이 없는 상품입니다. 다시 들어올지 알 수 없습니다.' };
  }

  const elapsed = lastRestockDate ? daysSince(lastRestockDate, today) : null;
  const elapsedText = elapsed !== null && elapsed >= 0 ? ` 마지막 재입고는 ${elapsed}일 전입니다.` : '';

  if (restockCount >= REPEAT_THRESHOLD) {
    return {
      tone: 'likely',
      message: `지금까지 ${restockCount}번 재입고된 상품입니다. 정기적으로 다시 들어오는 편이라 기다려 볼 만합니다.${elapsedText}`,
    };
  }
  return {
    tone: 'possible',
    message: `지금까지 ${restockCount}번 재입고됐습니다. 다시 들어올 수 있습니다.${elapsedText}`,
  };
}
