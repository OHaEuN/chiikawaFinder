'use client';

import dynamic from 'next/dynamic';

/** three.js 는 무거우니 홈에 들어왔을 때만 내려받는다. */
const LazyScene = dynamic(() => import('./HeroSceneInner'), {
  ssr: false,
  loading: () => <div className="hero-scene" aria-hidden />,
});

export function HeroScene() {
  return <LazyScene />;
}
