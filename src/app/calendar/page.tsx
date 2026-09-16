import type { Metadata } from 'next';
import Link from 'next/link';
import { goodsSummaries, PLACES, isOngoing } from '@/lib/data';
import { dDayLabel, koreanDate, today, upcomingReleases } from '@/lib/calendar';
import { GoodsCard } from '@/components/GoodsCard';
import { PlaceCard } from '@/components/PlaceCard';
import { Tag } from '@/components/Tag';

export const metadata: Metadata = {
  title: '발매 캘린더',
  description: '앞으로 나올 치이카와 굿즈와 진행 중인 팝업을 날짜순으로 모았습니다.',
};

const PREVIEW_PER_DAY = 6;

export default function CalendarPage() {
  const days = upcomingReleases(goodsSummaries());
  const now = today();
  const openingSoon = PLACES.filter((p) => p.period && isOngoing(p, now)).slice(0, 4);

  return (
    <>
      <div className="page-head">
        <h1>발매 캘린더</h1>
        <p>일본 신상은 발매일이 상품 정보에만 일본어로 붙어 있어 놓치기 쉬워요. 날짜순으로 정리했습니다.</p>
      </div>

      {days.length === 0 ? (
        <div className="panel"><h2>예정된 발매가 없어요</h2><p className="muted">새 발매일이 확인되면 여기에 올라옵니다.</p></div>
      ) : (
        days.map((day) => (
          <section key={day.date} className="release-day">
            <div className="section-head">
              <h2>
                {koreanDate(day.date)}
                <Tag tone={day.daysAway <= 3 ? 'pink' : 'yellow'}>{dDayLabel(day.daysAway)}</Tag>
              </h2>
              <span className="muted">{day.items.length}건</span>
            </div>
            <div className="grid">
              {day.items.slice(0, PREVIEW_PER_DAY).map((g) => <GoodsCard key={g.id} goods={g} />)}
            </div>
            {day.items.length > PREVIEW_PER_DAY && (
              <p className="muted release-more">
                이 날 발매는 {day.items.length}건입니다. <Link href="/goods">굿즈 전체 보기 →</Link>
              </p>
            )}
          </section>
        ))
      )}

      {openingSoon.length > 0 && (
        <>
          <div className="section-head"><h2>진행 중인 팝업 · 이벤트</h2><Link href="/offline">지도에서 보기 →</Link></div>
          <div className="grid grid-wide">{openingSoon.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
        </>
      )}

      <div className="notice">
        발매일은 치이카와 마켓 상품 정보에 붙은 날짜를 따릅니다. 예약 상품은 실제 발송이 늦어질 수 있고,
        한정 수량 상품은 발매 당일 품절되는 경우가 많습니다.
      </div>
    </>
  );
}
