import { EVENT_LABEL, sellOutDays, type GoodsEvent } from '@/lib/history';
import type { RestockCadence } from '@/lib/restock';

interface GoodsTimelineProps {
  events: GoodsEvent[];
  cadence: RestockCadence | null;
  /** 기록을 시작한 날. 이 앞의 품절은 우리가 못 봤다는 것을 밝힌다. */
  since: string;
}

const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * 한 상품이 지나온 길.
 *
 * 발매일과 재입고일은 공식 상품 태그에서 오고, 품절과 재개는 우리가 매일 보고 적은 것이다.
 * 출처가 섞여 있어 기록 시작일을 함께 밝힌다.
 */
export function GoodsTimeline({ events, cadence, since }: GoodsTimelineProps) {
  if (events.length < 2 && !cadence) return null;

  const spans = sellOutDays(events);
  const lines: string[] = [];
  if (cadence?.averageGapDays) {
    lines.push(`${cadence.firstDate}부터 ${cadence.count}번 재입고됐고, 평균 ${cadence.averageGapDays}일에 한 번꼴입니다.`);
  }
  if (spans.length > 0) {
    const days = Math.round(average(spans));
    lines.push(
      days === 0
        ? `다시 들어온 날 바로 품절됐습니다. 기록에 남은 ${spans.length}번 기준입니다.`
        : `다시 들어온 뒤 평균 ${days}일 만에 품절됐습니다. 기록에 남은 ${spans.length}번 기준입니다.`,
    );
  }

  return (
    <section className="panel">
      <h2>품절 · 재입고 기록</h2>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <ol className="timeline">
        {events.map((event) => (
          <li key={`${event.date}-${event.kind}`} className={`timeline-${event.kind}`}>
            <span className="timeline-date">{event.date}</span>
            <span className="timeline-what">{EVENT_LABEL[event.kind]}</span>
          </li>
        ))}
      </ol>
      <p className="muted">
        발매일과 재입고일은 공식 상품 정보에 붙은 날짜입니다. 품절과 재판매는 {since}부터 매일 아침 확인해
        적었으니, 기록은 그날부터입니다.
      </p>
    </section>
  );
}
