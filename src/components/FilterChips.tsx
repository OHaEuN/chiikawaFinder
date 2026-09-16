'use client';

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  allLabel?: string;
}

export function FilterChips<T extends string>({ options, value, onChange, allLabel = '전체' }: FilterChipsProps<T>) {
  return (
    <div className="chips" role="group">
      <button className="chip" aria-pressed={value === null} onClick={() => onChange(null)}>{allLabel}</button>
      {options.map((o) => (
        <button key={o.value} className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
