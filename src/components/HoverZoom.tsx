'use client';

import { useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { asset } from '@/lib/asset';
import { imageSources } from '@/lib/image';

/** 띄우는 사진의 한 변 */
const SIZE = 280;
const GAP = 14;

interface HoverZoomProps {
  src?: string;
  alt: string;
  className?: string;
  /** 안에 div 가 들어가는 자리에서는 div 로 낸다. */
  as?: 'span' | 'div';
  children: ReactNode;
}

/**
 * 목록의 38px 짜리 사진으로는 뭘 담는지 알아볼 수가 없다. 올려 두면 옆에 크게 띄운다.
 * body 에 붙여 띄운다. 카드와 메뉴에 overflow: hidden 이 걸려 있어 안에서 띄우면 잘린다.
 */
export function HoverZoom({ src, alt, className, as = 'span', children }: HoverZoomProps) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const Box = as;

  const show = (event: PointerEvent<HTMLElement>) => {
    // 손가락으로는 올려 둘 수가 없다. 마우스일 때만 띄운다.
    if (!src || event.pointerType !== 'mouse') return;
    // 38px 짜리 사진 옆에 띄우면 그 줄의 이름을 가린다. 줄 전체를 비켜서 띄운다.
    const box = (event.currentTarget.closest('li') ?? event.currentTarget).getBoundingClientRect();
    // 오른쪽이 모자라면 왼쪽에 띄운다.
    const right = box.right + GAP;
    const left = right + SIZE > window.innerWidth ? box.left - GAP - SIZE : right;
    const top = Math.min(Math.max(GAP, box.top + box.height / 2 - SIZE / 2), window.innerHeight - SIZE - GAP);
    setAt({ left, top });
  };

  const sized = src ? imageSources(src, SIZE) : null;

  return (
    <Box className={className} onPointerEnter={show} onPointerLeave={() => setAt(null)}>
      {children}
      {at && sized &&
        createPortal(
          <span className="zoom-pop" style={{ left: at.left, top: at.top }} aria-hidden="true">
            <img src={asset(sized.src)} srcSet={sized.srcSet} sizes={`${SIZE}px`} alt="" referrerPolicy="no-referrer" />
          </span>,
          document.body,
        )}
    </Box>
  );
}
