/**
 * 날마다 달라진 것만 남기는 기록.
 *
 * 공식몰은 어제와 뭐가 달라졌는지 알려주지 않는다. 품절은 소리 없이 일어나고,
 * 재입고 목록은 하루 지나면 사라진다. 매일 긁은 결과를 앞날과 맞대 보면 그 변화가 남는다.
 * 상품 하나하나의 값을 다시 적지 않고 바뀐 상품의 id 만 적어 파일이 커지지 않게 한다.
 */

/** 이보다 오래된 기록은 버린다. 반년이면 재입고 주기를 보기에 충분하다. */
export const HISTORY_WINDOW_DAYS = 180;

/**
 * 굿즈 목록은 최근 6개월만 담는 창이라, 오래된 상품이 재입고로 다시 들어오면
 * 처음 보는 id 처럼 보인다. 발매일이 이만큼 안 지난 것만 신상으로 센다.
 */
export const NEW_ARRIVAL_MAX_AGE_DAYS = 60;

export const emptyHistory = () => ({ updatedAt: '', days: [] });

const daysBefore = (date, days) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

/**
 * 어제 목록과 오늘 목록을 맞대어 그날의 변화를 뽑는다.
 * previous 가 비어 있으면 비교 대상이 없으므로 신상도 품절도 없다고 본다.
 */
export function diffDay({ date, previous, current, krwPerJpy }) {
  const before = new Map(previous.map((g) => [g.id, g]));
  const since = daysBefore(date, NEW_ARRIVAL_MAX_AGE_DAYS);
  const added = [];
  const soldOut = [];
  const backInStock = [];

  for (const goods of current) {
    const was = before.get(goods.id);
    if (!was) {
      if (before.size > 0 && goods.releaseDate >= since) added.push(goods.id);
      continue;
    }
    if (was.available === true && goods.available === false) soldOut.push(goods.id);
    if (was.available === false && goods.available === true) backInStock.push(goods.id);
  }

  return { date, krwPerJpy, added, soldOut, backInStock };
}

/** 아무것도 안 바뀐 날은 환율만 적는다. 환율은 매일 달라서 그래프가 끊기면 안 된다. */
export function appendDay(history, day, windowDays = HISTORY_WINDOW_DAYS) {
  const cutoff = daysBefore(day.date, windowDays);
  const days = [...history.days.filter((d) => d.date !== day.date && d.date >= cutoff), day].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  return { updatedAt: day.date, days };
}
