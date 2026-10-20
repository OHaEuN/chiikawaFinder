import type { Metadata } from 'next';
import Link from 'next/link';
import { ONLINE } from '@/lib/data';
import type { OnlineContent } from '@/types/online';
import { Tag } from '@/components/Tag';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: '치이카와 애니 어디서 봐',
  description:
    '먼작귀(치이카와) 애니메이션을 한국에서 볼 수 있는 곳을 한 표에 모았습니다. 넷플릭스·라프텔·티빙·왓챠·웨이브·유튜브의 시즌과 더빙 여부, 무료인지 유료인지.',
};

const AUDIO_LABEL: Record<NonNullable<OnlineContent['audio']>, string> = {
  dub: '한국어 더빙',
  sub: '한국어 자막',
  both: '더빙 · 자막',
  original: '일본어',
};

const isAnime = (item: OnlineContent) => item.category === 'anime';

/** 숫자는 시즌 번호, 그 밖은 「극장판」처럼 그대로 쓰는 말이다. */
const seasonLabel = (season: string) => (/^\d+$/.test(season) ? `시즌${season}` : season);

/** 무료 먼저, 그다음 시즌을 많이 가진 곳. 처음 보는 사람이 고르는 순서다. */
const byUsefulness = (a: OnlineContent, b: OnlineContent) =>
  Number(b.free) - Number(a.free) || (b.seasons?.length ?? 0) - (a.seasons?.length ?? 0);

function WatchTable({ items }: { items: OnlineContent[] }) {
  return (
    <div className="table-wrap">
      <table className="table watch-table">
        <thead>
          <tr>
            <th>어디서</th>
            <th>시즌</th>
            <th>음성</th>
            <th>요금</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <TrackedLink href={item.url} event="watch_open" props={{ platform: item.platform }}>
                  <strong>{item.platform}</strong> ↗
                </TrackedLink>
                <div className="muted watch-note">{item.description}</div>
              </td>
              <td className="num">{item.seasons?.length ? item.seasons.map(seasonLabel).join(' · ') : '—'}</td>
              <td className="num">{item.audio ? AUDIO_LABEL[item.audio] : '—'}</td>
              <td className="num">
                {item.free ? <Tag tone="mint">무료</Tag> : <Tag tone="yellow">유료</Tag>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WatchPage() {
  const anime = ONLINE.filter(isAnime);
  const korea = anime.filter((i) => i.region === 'KR').sort(byUsefulness);
  const elsewhere = anime.filter((i) => i.region !== 'KR').sort(byUsefulness);
  const free = korea.find((i) => i.free);

  return (
    <>
      <div className="page-head">
        <h1>애니 어디서 봐</h1>
        <p>
          치이카와는 한국에서 「먼작귀」라는 이름으로 나옵니다. 그래서 치이카와로 검색하면 안 나오는 곳이 많습니다.
          한국에서 볼 수 있는 곳을 전부 모아 시즌과 더빙 여부까지 한 표에 담았습니다.
        </p>
      </div>

      {free && (
        <div className="panel">
          <h2>돈 안 내고 보려면</h2>
          <p className="muted">{free.title} · {free.description}</p>
          <TrackedLink className="btn" href={free.url} event="watch_open" props={{ platform: free.platform, slot: 'free' }}>
            {free.platform}에서 보기 ↗
          </TrackedLink>
        </div>
      )}

      <div className="section-head"><h2>한국에서 보는 곳</h2></div>
      <WatchTable items={korea} />

      <div className="section-head"><h2>일본·해외</h2></div>
      <WatchTable items={elsewhere} />

      <div className="notice">
        넷플릭스·티빙·왓챠·웨이브는 작품 주소가 자주 바뀌어 검색 결과 페이지로 연결합니다. 더빙판은 일본 방영을 몇 달 뒤따라오기 때문에
        최신 화를 바로 보려면 자막이나 일본어 쪽을 봐야 합니다. 만화·게임·굿즈 경로는{' '}
        <Link href="/online">온라인 콘텐츠</Link>에 모아 두었습니다.
      </div>
    </>
  );
}
