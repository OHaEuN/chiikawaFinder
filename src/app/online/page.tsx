import type { Metadata } from 'next';
import Link from 'next/link';
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
      <div className="panel crosslink">
        <strong>애니부터 보려고요?</strong>
        <p className="muted">
          한국에서는 「먼작귀」라는 이름으로 나와 치이카와로 검색하면 안 나오는 곳이 많습니다.
          볼 수 있는 곳을 시즌·더빙까지 한 표에 모아 뒀어요.
        </p>
        <Link className="btn soft" href="/watch">애니 어디서 봐 →</Link>
      </div>
      <OnlineList items={ONLINE} />
    </>
  );
}
