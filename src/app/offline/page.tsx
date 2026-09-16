import type { Metadata } from 'next';
import { PLACES } from '@/lib/data';
import { OfflineExplorer } from './OfflineExplorer';

export const metadata: Metadata = { title: '오프라인 콘텐츠' };

export default function OfflinePage() {
  return (
    <>
      <div className="page-head">
        <h1>오프라인 콘텐츠</h1>
        <p>한국과 일본의 치이카와 팝업, 매장, 카페, 콜라보 식당을 지도와 함께 모았어요.</p>
      </div>
      <OfflineExplorer places={PLACES} />
    </>
  );
}
