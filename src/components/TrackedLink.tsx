'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/analytics';

interface TrackedLinkProps {
  href: string;
  event: string;
  props?: Record<string, string | number | boolean>;
  className?: string;
  sponsored?: boolean;
  children: ReactNode;
}

/** 바깥으로 나가는 링크. 어떤 항목이 실제 클릭으로 이어지는지 남긴다. */
export function TrackedLink({ href, event, props, className, sponsored = false, children }: TrackedLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel={sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      className={className}
      onClick={() => track(event, props)}
    >
      {children}
    </a>
  );
}
