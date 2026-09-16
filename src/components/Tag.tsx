import type { ReactNode } from 'react';

type TagTone = 'pink' | 'blue' | 'yellow' | 'mint' | 'lavender' | 'plain';

interface TagProps {
  tone?: TagTone;
  children: ReactNode;
}

export function Tag({ tone = 'plain', children }: TagProps) {
  return <span className={`tag ${tone === 'plain' ? '' : tone}`}>{children}</span>;
}
