import type { DayChange } from './history.ts';
import { koreanName } from './goods-name.ts';
import { koreanDate } from './calendar.ts';

/**
 * 오늘의 변화를 Atom 피드로.
 *
 * 정적 사이트라 알림을 보낼 수 없다. 대신 구독할 수 있는 파일을 두면
 * RSS 리더나 슬랙·디스코드의 피드 앱이 매일 변화를 대신 가져간다.
 * 하루가 한 항목이고, 아무것도 안 바뀐 날은 항목이 없다.
 */

/** 피드에 싣는 날 수. 리더는 새 항목만 보므로 길게 둘 이유가 없다. */
export const FEED_LIMIT = 30;

/** 매일 06:00 KST 에 확인한다. 항목의 갱신 시각도 그 시각이다. */
const CHECK_TIME = 'T06:00:00+09:00';

const escape = (text: string) =>
  text.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c);

const section = (title: string, items: DayChange['added'], siteUrl: string) =>
  items.length === 0
    ? ''
    : `<h3>${title}</h3><ul>${items
        .map((g) => `<li><a href="${siteUrl}goods/${g.id}/">${escape(koreanName(g.name))}</a> — ${escape(g.price)}</li>`)
        .join('')}</ul>`;

export const entryTitle = (day: DayChange) =>
  [
    koreanDate(day.date),
    day.added.length > 0 && `신상 ${day.added.length}`,
    day.backInStock.length > 0 && `재입고 ${day.backInStock.length}`,
    day.soldOut.length > 0 && `품절 ${day.soldOut.length}`,
  ]
    .filter(Boolean)
    .join(' · ');

export function buildFeed(days: DayChange[], siteUrl: string): string {
  const updated = days[0] ? `${days[0].date}${CHECK_TIME}` : new Date().toISOString();
  const entries = days
    .map((day) => {
      const html =
        section('새로 올라온 상품', day.added, siteUrl) +
        section('다시 들어온 상품', day.backInStock, siteUrl) +
        section('품절된 상품', day.soldOut, siteUrl);
      return `<entry>
<title>${escape(entryTitle(day))}</title>
<link href="${siteUrl}today/"/>
<id>${siteUrl}today/#${day.date}</id>
<updated>${day.date}${CHECK_TIME}</updated>
<content type="html">${escape(html)}</content>
</entry>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>치이카와 파인더 · 오늘의 변화</title>
<subtitle>치이카와 마켓을 매일 06:00(KST)에 확인해 어제와 달라진 신상·재입고·품절만 모읍니다.</subtitle>
<link href="${siteUrl}feed.xml" rel="self"/>
<link href="${siteUrl}today/"/>
<id>${siteUrl}feed.xml</id>
<updated>${updated}</updated>
${entries}
</feed>
`;
}
