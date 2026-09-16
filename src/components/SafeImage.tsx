'use client';

import { useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  fallback?: string;
  /** 흰 배경 위에 파스텔 원으로 표시한다. 인물 카드처럼 배경이 흰 목록에 쓴다. */
  onWhite?: boolean;
  /** 이미지가 없을 때 파스텔 배경을 고르는 기준값. 같은 항목은 늘 같은 색이 된다. */
  seed?: string;
}

const PALETTE = ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--mint)', 'var(--lavender)', 'var(--peach)'];

/** 인물 카드는 흰 배경 일러스트가 기준이라 자리표시자도 흰 배경에 파스텔 원으로 맞춘다. */
const DISC_STYLE = { width: '54%', aspectRatio: '1', borderRadius: '50%', display: 'grid', placeItems: 'center' } as const;

const hash = (text: string) => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function SafeImage({ src, alt, fallback = '🐾', seed, onWhite = false }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const background = PALETTE[hash(seed ?? alt) % PALETTE.length];
    if (onWhite) {
      return (
        <div className="ph" style={{ background: 'var(--surface)' }} aria-label={alt}>
          <span style={{ ...DISC_STYLE, background }}>{fallback}</span>
        </div>
      );
    }
    return <div className="ph" style={{ background }} aria-label={alt}>{fallback}</div>;
  }
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
