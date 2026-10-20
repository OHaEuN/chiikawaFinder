import type { Metadata } from 'next';
import Link from 'next/link';
import { PLACES } from '@/lib/data';
import { OfflineExplorer } from './OfflineExplorer';

export const metadata: Metadata = {
  title: '오프라인 콘텐츠',
  description:
    '치이카와 랜드와 콜라보 카페, 팝업스토어를 지도에 모았습니다. 지금 열려 있는 곳과 끝난 곳, 매장별 한정 굿즈를 함께 봅니다.',
};

export default function OfflinePage() {
  return (
    <>
      <div className="page-head">
        <h1>오프라인 콘텐츠</h1>
        <p>한국과 일본의 치이카와 팝업, 매장, 카페, 콜라보 식당을 지도와 함께 모았습니다.</p>
      </div>
      <div className="panel crosslink">
        <strong>하루에 몇 군데 돌 거라면</strong>
        <p className="muted">도시별로 묶어 가까운 순서대로 이어 두었습니다. 구간마다 걸어갈지 전철을 탈지도 적혀 있습니다.</p>
        <Link className="btn soft" href="/offline/course">토벌 코스 보기 →</Link>
      </div>
      <OfflineExplorer places={PLACES} />
    </>
  );
}
