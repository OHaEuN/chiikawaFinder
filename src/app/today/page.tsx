import type { Metadata } from 'next';
import Link from 'next/link';
import { GOODS, HISTORY, goodsById, goodsSummaries } from '@/lib/data';
import { changeCount, fxSeries, fxVerdict, recentChanges, type DayChange } from '@/lib/history';
import { koreanDate } from '@/lib/calendar';
import { GoodsCard } from '@/components/GoodsCard';
import { Sparkline } from '@/components/Sparkline';
import { Tag } from '@/components/Tag';

export const metadata: Metadata = {
  title: '오늘의 변화',
  description:
    '치이카와 마켓을 매일 긁어 어제와 달라진 것만 모읍니다. 오늘 품절된 상품, 새로 올라온 상품, 다시 들어온 상품과 원/엔 환율 흐름.',
};

/** 한 날짜에 다 펼치면 화면이 길어진다. 나머지는 숫자로만 알린다. */
const PREVIEW = 6;
const PAST_DAYS = 10;
/** 환율 체감을 위한 기준 금액. 공구 무배컷과 비슷해 감이 온다. */
const SAMPLE_YEN = 10000;

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

interface ChangeGroupProps {
  title: string;
  tone: 'pink' | 'mint' | 'yellow';
  items: DayChange['added'];
}

/** 접어 둔 나머지. 카드까지 다 그리면 한 화면이 끝없이 길어져 이름만 잇는다. */
function NameList({ items }: { items: DayChange['added'] }) {
  return (
    <ul className="namelist">
      {items.map((g) => (
        <li key={g.id}><Link href={`/goods/${g.id}`}>{g.name}</Link></li>
      ))}
    </ul>
  );
}

function ChangeGroup({ title, tone, items }: ChangeGroupProps) {
  if (items.length === 0) return null;
  const rest = items.slice(PREVIEW);
  return (
    <section className="release-day">
      <div className="section-head">
        <h2 className="restock-head">
          {title}
          <Tag tone={tone}>{items.length}건</Tag>
        </h2>
      </div>
      <div className="grid">{items.slice(0, PREVIEW).map((g) => <GoodsCard key={g.id} goods={g} />)}</div>
      {rest.length > 0 && (
        <details className="release-more">
          <summary>외 {rest.length}건 더 보기</summary>
          <NameList items={rest} />
        </details>
      )}
    </section>
  );
}

export default function TodayPage() {
  const summaries = goodsSummaries();
  const byId = goodsById(summaries);
  const changes = recentChanges(HISTORY, byId, PAST_DAYS + 1);
  const [latest, ...past] = changes;
  const series = fxSeries(HISTORY);
  const verdict = fxVerdict(series);

  const totals = HISTORY.days.reduce(
    (acc, d) => ({
      soldOut: acc.soldOut + d.soldOut.length,
      added: acc.added + d.added.length,
      backInStock: acc.backInStock + d.backInStock.length,
    }),
    { soldOut: 0, added: 0, backInStock: 0 },
  );

  return (
    <>
      <div className="page-head">
        <h1>오늘의 변화</h1>
        <p>
          매일 아침 치이카와 마켓을 통째로 긁어 어제와 맞대 봅니다. 공식몰은 뭐가 품절됐는지 알려주지 않고,
          재입고 목록은 하루 지나면 사라집니다. 그 사이에 달라진 것만 여기 남습니다.
        </p>
      </div>

      {verdict && (
        <section className="panel fx">
          <div className="fx-head">
            <div>
              <div className="fx-rate">
                {verdict.today.krwPerJpy.toFixed(2)}
                <small>원 / 엔</small>
              </div>
              <div className="muted">{verdict.today.date} 기준</div>
            </div>
            <div className={`fx-chart fx-${verdict.tone}`}>
              <Sparkline values={series.map((p) => p.krwPerJpy)} label={`최근 ${series.length}일 원/엔 환율 흐름`} />
              <div className="fx-scale">
                <span>가장 쌀 때 {verdict.min.krwPerJpy.toFixed(2)}</span>
                <span>가장 비쌀 때 {verdict.max.krwPerJpy.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <p className={`restock restock-${verdict.tone === 'good' ? 'likely' : verdict.tone === 'bad' ? 'possible' : 'unknown'}`}>
            {verdict.message} 1만 엔짜리를 담으면 오늘은 {won(SAMPLE_YEN * verdict.today.krwPerJpy)}, 가장 비쌌던 날 기준으로는{' '}
            {won(SAMPLE_YEN * verdict.max.krwPerJpy)}입니다.
          </p>
          <p className="muted fx-note">
            상품값은 엔화로 고정돼 좀처럼 바뀌지 않습니다. 한국에서 내는 돈이 움직이는 건 거의 환율 때문이라,
            날짜별 환율 하나로 전부 환산합니다. <Link href="/calculator">직구 계산기에서 실제 총액 보기 →</Link>
          </p>
        </section>
      )}

      {latest ? (
        <>
          <div className="section-head">
            <h2>{koreanDate(latest.date)}에 달라진 것</h2>
            <span className="muted">{changeCount(latest)}건</span>
          </div>
          <ChangeGroup title="새로 올라온 상품" tone="mint" items={latest.added} />
          <ChangeGroup title="다시 들어온 상품" tone="yellow" items={latest.backInStock} />
          <ChangeGroup title="품절된 상품" tone="pink" items={latest.soldOut} />
        </>
      ) : (
        <div className="panel">
          <h2>아직 쌓인 기록이 없어요</h2>
          <p className="muted">매일 아침 한 번 긁습니다. 하루 지나면 여기에 변화가 올라옵니다.</p>
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="section-head">
            <h2>지난 기록</h2>
            <Link href="/calendar">발매 캘린더 →</Link>
          </div>
          <div className="stack">
            {past.map((day) => (
              <details key={day.date} className="daylog">
                <summary className="daylog-head">
                  <span className="daylog-date">{koreanDate(day.date)}</span>
                  <span className="tags">
                    {day.added.length > 0 && <Tag tone="mint">신상 {day.added.length}</Tag>}
                    {day.backInStock.length > 0 && <Tag tone="yellow">재입고 {day.backInStock.length}</Tag>}
                    {day.soldOut.length > 0 && <Tag tone="pink">품절 {day.soldOut.length}</Tag>}
                  </span>
                  <span className="daylog-names muted">
                    {[...day.added, ...day.backInStock, ...day.soldOut]
                      .slice(0, 3)
                      .map((g) => g.name)
                      .join(' · ')}
                  </span>
                </summary>
                <div className="daylog-body">
                  {day.added.length > 0 && <><h3>새로 올라온 상품</h3><NameList items={day.added} /></>}
                  {day.backInStock.length > 0 && <><h3>다시 들어온 상품</h3><NameList items={day.backInStock} /></>}
                  {day.soldOut.length > 0 && <><h3>품절된 상품</h3><NameList items={day.soldOut} /></>}
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      <div className="notice">
        {HISTORY.days.length}일치 기록을 쌓는 동안 품절 {totals.soldOut.toLocaleString('ko-KR')}건, 신상{' '}
        {totals.added.toLocaleString('ko-KR')}건, 재입고 {totals.backInStock.toLocaleString('ko-KR')}건을 봤습니다.
        지금 추적 중인 상품은 {GOODS.length.toLocaleString('ko-KR')}개입니다. 긁는 시점은 매일 06:00(KST) 한 번이라,
        그 사이에 들어왔다 나간 상품은 잡히지 않습니다.
      </div>
    </>
  );
}
