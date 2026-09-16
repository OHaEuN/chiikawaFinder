'use client';

import { useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  fallback?: string;
  /** 이미지가 없을 때 파스텔 배경을 고르는 기준값. 같은 항목은 늘 같은 색이 된다. */
  seed?: string;
}

const PALETTES = [
  ['var(--pink)', 'var(--yellow)'],
  ['var(--blue)', 'var(--mint)'],
  ['var(--lavender)', 'var(--pink)'],
  ['var(--yellow)', 'var(--mint)'],
  ['var(--mint)', 'var(--blue)'],
  ['var(--pink)', 'var(--lavender)'],
];

const hash = (text: string) => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function SafeImage({ src, alt, fallback = '🐾', seed }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const [from, to] = PALETTES[hash(seed ?? alt) % PALETTES.length];
    return (
      <div className="ph" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} aria-label={alt}>
        {fallback}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
