'use client';

import { useEffect, useRef } from 'react';

interface FilterOption {
  value: string;
  label: string;
  /** 고르기 전에 몇 건인지 보이게. 0건짜리를 눌러 보고 빈 화면을 만나는 일을 줄인다. */
  count?: number;
}

interface FilterSelectProps {
  /** 닫혀 있을 때 보이는 이름 */
  label: string;
  options: FilterOption[];
  /** 빈 배열이면 전체. 고른 것끼리는 OR 로 본다. */
  value: string[];
  onChange: (value: string[]) => void;
  /** 한 번에 하나만 열리게 묶는 이름 */
  group: string;
}

/**
 * 고를 거리가 열 개를 넘으면 칩은 화면을 다 먹는다. 접어 두고 필요할 때만 펼친다.
 * 여닫기는 <details> 가 하고, 같은 group 끼리는 브라우저가 알아서 하나만 열어 둔다.
 */
export function FilterSelect({ label, options, value, onChange, group }: FilterSelectProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  // 열어 둔 채로 두면 메뉴가 결과를 가린다. 밖을 누르면 닫는다.
  useEffect(() => {
    const close = (event: MouseEvent) => {
      const el = ref.current;
      if (el?.open && !el.contains(event.target as Node)) el.open = false;
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <details className="filter" name={group} ref={ref}>
      <summary>
        {label}
        {value.length > 0 && <span className="filter-badge">{value.length}</span>}
      </summary>
      <div className="filter-menu">
        {options.map((o) => (
          <label key={o.value} className="filter-option">
            <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
            <span className="filter-option-label">{o.label}</span>
            {o.count !== undefined && <span className="filter-option-count">{o.count.toLocaleString('ko-KR')}</span>}
          </label>
        ))}
        {value.length > 0 && (
          <button type="button" className="filter-clear" onClick={() => onChange([])}>
            {label} 조건 지우기
          </button>
        )}
      </div>
    </details>
  );
}
