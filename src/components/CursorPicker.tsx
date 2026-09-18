'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

const CHARACTERS = [
  { key: 'chiikawa', name: '치이카와' },
  { key: 'hachiware', name: '하치와레' },
  { key: 'usagi', name: '우사기' },
] as const;

type CursorKey = (typeof CHARACTERS)[number]['key'];

const STORAGE_KEY = 'chiikawa-cursor';
const DEFAULT: CursorKey = 'chiikawa';

const isCursorKey = (value: string | null): value is CursorKey =>
  CHARACTERS.some((c) => c.key === value);

/** 커서로 쓸 캐릭터를 고른다. 고른 값은 <html> 의 속성으로 옮겨 CSS 가 읽는다. */
export function CursorPicker() {
  const [current, setCurrent] = useState<CursorKey>(DEFAULT);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // 저장소를 막아 둔 브라우저에서는 기본값으로 둔다.
    }
    if (isCursorKey(saved)) setCurrent(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.cursor = current;
  }, [current]);

  const choose = (key: CursorKey) => {
    setCurrent(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // 저장에 실패해도 이번 방문에는 적용된다.
    }
    track('cursor_change', { character: key });
  };

  return (
    <div className="cursor-picker">
      <span className="cursor-picker-label">커서</span>
      <div className="cursor-picker-options" role="group" aria-label="커서 캐릭터 선택">
        {CHARACTERS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-label={c.name}
            aria-pressed={current === c.key}
            onClick={() => choose(c.key)}
          >
            <img src={`/cursor/${c.key}.png`} alt="" width={26} height={26} />
          </button>
        ))}
      </div>
    </div>
  );
}
