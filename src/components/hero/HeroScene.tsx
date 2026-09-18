'use client';

import dynamic from 'next/dynamic';
import { asset } from '@/lib/asset';

/** three.js 는 600KB 가 넘는다. 내려받는 동안 빈 칸을 두면 화면이 멈춘 것처럼 보인다. */
function HeroLoading() {
  return (
    <div className="hero-scene hero-loading" role="status" aria-label="캐릭터를 부르는 중">
      <img src={asset('/images/chiikawa-face.png')} alt="" width={46} height={38} />
      <span className="hero-loading-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

const LazyScene = dynamic(() => import('./HeroSceneInner'), {
  ssr: false,
  loading: HeroLoading,
});

export function HeroScene() {
  return <LazyScene />;
}
