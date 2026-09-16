import { useMemo, useState } from 'react';

export function useChipFilter<T, K extends string>(items: T[], pick: (item: T) => K) {
  const [value, setValue] = useState<K | null>(null);
  const filtered = useMemo(() => (value === null ? items : items.filter((i) => pick(i) === value)), [items, value, pick]);
  return { value, setValue, filtered };
}
