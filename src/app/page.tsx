import Link from 'next/link';
import { CHARACTERS, HISTORY, PLACES, goodsById, goodsSummaries, isOngoing } from '@/lib/data';
import { changeCount, fxSeries, fxVerdict, recentChanges } from '@/lib/history';
import { Icon, type IconName } from '@/components/Icon';
import { HeroScene } from '@/components/hero/HeroScene';
import { GoodsCard } from '@/components/GoodsCard';
import { PlaceCard } from '@/components/PlaceCard';
import { CharacterCard } from '@/components/CharacterCard';

const TILES: { href: string; icon: IconName; title: string; desc: string }[] = [
  { href: '/today', icon: 'today', title: '오늘의 변화', desc: '품절 · 신상 · 환율 흐름' },
  { href: '/watch', icon: 'online', title: '애니 어디서 봐', desc: '넷플릭스 · 라프텔 · 무료 더빙' },
  { href: '/offline/course', icon: 'offline', title: '토벌 코스', desc: '도시별로 하루에 도는 순서' },
  { href: '/calculator', icon: 'calculator', title: '직구 계산기', desc: '최종 얼마인지 · 공구 수수료' },
  { href: '/goods', icon: 'goods', title: '굿즈 신상', desc: '최근 6개월 신상 · 콜라보' },
  { href: '/calendar', icon: 'calendar', title: '발매 · 재입고', desc: '신상과 다시 들어온 상품' },
  { href: '/characters', icon: 'character', title: '인물 · 세계관', desc: '캐릭터 프로필과 등장 에피소드' },
  { href: '/offline', icon: 'offline', title: '오프라인 지도', desc: '팝업 · 매장 · 카페 위치' },
];

const HOME_LIMIT = 8;

export default function HomePage() {
  const ongoing = PLACES.filter((p) => isOngoing(p) && p.period).slice(0, 4);
  const summaries = goodsSummaries();
  const [latest] = recentChanges(HISTORY, goodsById(summaries), 1);
  const verdict = fxVerdict(fxSeries(HISTORY));
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>치이카와 파인더</h1>
          <p>
            작고 귀여운 것들의 세계, 치이카와 정보를 한 곳에 모았어요.
            <br />
            인물 프로필부터 팝업 지도, 신상 굿즈까지.
          </p>
        </div>
        <HeroScene />
      </section>
      <section className="section-tiles">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="tile">
            <span className="tile-icon"><Icon name={t.icon} size={20} /></span>
            <span className="tile-text">
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
            </span>
          </Link>
        ))}
      </section>

      {latest && verdict && (
        <Link href="/today" className="panel pulse">
          <div className="pulse-main">
            <strong>{latest.date}</strong> 치이카와 마켓에서 {changeCount(latest)}건이 달라졌어요
            {latest.soldOut.length > 0 && ` · 품절 ${latest.soldOut.length}`}
            {latest.added.length > 0 && ` · 신상 ${latest.added.length}`}
            {latest.backInStock.length > 0 && ` · 재입고 ${latest.backInStock.length}`}
          </div>
          <div className="muted">
            환율 {verdict.today.krwPerJpy.toFixed(2)}원/엔 · {verdict.message} 자세히 보기 →
          </div>
        </Link>
      )}

      <div className="section-head"><h2>인물</h2><Link href="/characters">전체 보기 →</Link></div>
      <div className="grid">{CHARACTERS.slice(0, HOME_LIMIT).map((c) => <CharacterCard key={c.slug} character={c} />)}</div>

      {ongoing.length > 0 && (
        <>
          <div className="section-head"><h2>진행 중인 팝업 · 이벤트</h2><Link href="/offline">지도에서 보기 →</Link></div>
          <div className="grid grid-wide">{ongoing.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
        </>
      )}

      <div className="section-head"><h2>최신 굿즈</h2><Link href="/goods">전체 보기 →</Link></div>
      <div className="grid">{summaries.slice(0, HOME_LIMIT).map((g) => <GoodsCard key={g.id} goods={g} />)}</div>
    </>
  );
}
