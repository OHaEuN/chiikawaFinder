'use client';

import type { OnlineContent, OnlineCategory } from '@/types/online';
import { ONLINE_CATEGORY_LABEL } from '@/lib/labels';
import { useChipFilter } from '@/hooks/useChipFilter';
import { FilterChips } from '@/components/FilterChips';
import { OnlineRow } from '@/components/OnlineRow';

interface OnlineListProps { items: OnlineContent[] }

const pickCategory = (i: OnlineContent) => i.category;

export function OnlineList({ items }: OnlineListProps) {
  const { value, setValue, filtered } = useChipFilter(items, pickCategory);
  const options = (Object.keys(ONLINE_CATEGORY_LABEL) as OnlineCategory[])
    .filter((c) => items.some((i) => i.category === c))
    .map((c) => ({ value: c, label: ONLINE_CATEGORY_LABEL[c] }));
  return (
    <>
      <FilterChips options={options} value={value} onChange={setValue} />
      <div className="stack">{filtered.map((i) => <OnlineRow key={i.id} item={i} />)}</div>
    </>
  );
}
