import Link from 'next/link';
import { CHARACTERS, PLACES, goodsSummaries, isOngoing } from '@/lib/data';
import { Icon, type IconName } from '@/components/Icon';
import { GoodsCard } from '@/components/GoodsCard';
import { PlaceCard } from '@/components/PlaceCard';
import { CharacterCard } from '@/components/CharacterCard';

const TILES: { href: string; icon: IconName; title: string; desc: string }[] = [
  { href: '/characters', icon: 'character', title: '인물 · 세계관', desc: '캐릭터 프로필과 등장 에피소드' },
  { href: '/online', icon: 'online', title: '온라인 콘텐츠', desc: '만화 · 애니 · 나가노 작가 작품' },
  { href: '/offline', icon: 'offline', title: '오프라인 콘텐츠', desc: '팝업 · 매장 · 카페 지도' },
  { href: '/goods', icon: 'goods', title: '굿즈 신상', desc: '최근 6개월 신상 · 콜라보' },
];

const HOME_LIMIT = 8;

export default function HomePage() {
  const ongoing = PLACES.filter((p) => isOngoing(p) && p.period).slice(0, 4);
  return (
    <>
      <section className="hero">
        <h1>치이카와 파인더</h1>
        <p>작고 귀여운 것들의 세계, 치이카와 정보를 한 곳에 모았어요. 인물 프로필부터 팝업 지도, 신상 굿즈까지.</p>
      </section>
      <section className="section-tiles">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="tile">
            <span className="tile-icon"><Icon name={t.icon} size={21} /></span>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </Link>
        ))}
      </section>

      <div className="section-head"><h2>최신 굿즈</h2><Link href="/goods">전체 보기 →</Link></div>
      <div className="grid">{goodsSummaries().slice(0, HOME_LIMIT).map((g) => <GoodsCard key={g.id} goods={g} />)}</div>

      {ongoing.length > 0 && (
        <>
          <div className="section-head"><h2>진행 중인 팝업 · 이벤트</h2><Link href="/offline">지도에서 보기 →</Link></div>
          <div className="grid grid-wide">{ongoing.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
        </>
      )}

      <div className="section-head"><h2>인물</h2><Link href="/characters">전체 보기 →</Link></div>
      <div className="grid">{CHARACTERS.slice(0, HOME_LIMIT).map((c) => <CharacterCard key={c.slug} character={c} />)}</div>
    </>
  );
}
