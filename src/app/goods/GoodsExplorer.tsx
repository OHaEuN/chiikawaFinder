'use client';

import { useMemo, useState } from 'react';
import type { GoodsSummary } from '@/types/goods';
import { FilterChips } from '@/components/FilterChips';
import { GoodsCard } from '@/components/GoodsCard';

interface GoodsExplorerProps { goods: GoodsSummary[] }

type Country = GoodsSummary['country'];

const PAGE_SIZE = 48;
const TOP_BRANDS = 12;

export function GoodsExplorer({ goods }: GoodsExplorerProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const brands = useMemo(() => {
    const count = new Map<string, number>();
    goods.forEach((g) => count.set(g.brand, (count.get(g.brand) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_BRANDS).map(([b]) => ({ value: b, label: b }));
  }, [goods]);

  const categories = useMemo(
    () => [...new Set(goods.map((g) => g.category))].sort().map((c) => ({ value: c, label: c })),
    [goods],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return goods.filter(
      (g) =>
        (!country || g.country === country) &&
        (!brand || g.brand === brand) &&
        (!category || g.category === category) &&
        (!q || g.name.toLowerCase().includes(q) || (g.collab ?? '').toLowerCase().includes(q)),
    );
  }, [goods, country, brand, category, query]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setLimit(PAGE_SIZE); };

  return (
    <>
      <input
        className="search"
        type="search"
        placeholder="상품명으로 검색 (예: マスコット, 스시, ぬいぐるみ)"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }}
      />
      <FilterChips options={[{ value: 'JP', label: '🇯🇵 일본' }, { value: 'KR', label: '🇰🇷 한국' }]} value={country} onChange={reset(setCountry)} />
      <FilterChips options={categories} value={category} onChange={reset(setCategory)} allLabel="모든 카테고리" />
      <FilterChips options={brands} value={brand} onChange={reset(setBrand)} allLabel="모든 브랜드" />
      <p className="muted" style={{ fontSize: '0.9rem' }}>{filtered.length.toLocaleString('ko-KR')}개</p>
      <div className="grid">{filtered.slice(0, limit).map((g) => <GoodsCard key={g.id} goods={g} />)}</div>
      {filtered.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn soft" onClick={() => setLimit((l) => l + PAGE_SIZE)}>더 보기 ({(filtered.length - limit).toLocaleString('ko-KR')}개 남음)</button>
        </div>
      )}
    </>
  );
}
