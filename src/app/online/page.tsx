import type { Metadata } from 'next';
import { ONLINE } from '@/lib/data';
import { OnlineList } from './OnlineList';

export const metadata: Metadata = { title: '온라인 콘텐츠' };

export default function OnlinePage() {
  return (
    <>
      <div className="page-head">
        <h1>온라인 콘텐츠</h1>
        <p>치이카와 만화·애니메이션과 나가노 작가의 영상·일러스트를 볼 수 있는 경로를 모았어요. 누르면 바로 이동합니다.</p>
      </div>
      <OnlineList items={ONLINE} />
    </>
  );
}
