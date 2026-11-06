'use client';

import { useMemo, useState } from 'react';
import type { GoodsSummary } from '@/types/goods';
import { FilterChips } from '@/components/FilterChips';
import { GoodsCard } from '@/components/GoodsCard';
import { track } from '@/lib/analytics';
import { searchEntry, searchScore, searchTerms } from '@/lib/search';
import { stockState } from '@/lib/stock';

interface GoodsExplorerProps {
  goods: GoodsSummary[];
  /** 슬러그로는 못 읽으니 이름이 필요하다. 데이터 전체를 번들에 끌고 오지 않으려고 화면에서 받는다. */
  characterNames: Record<string, string>;
}

type Country = GoodsSummary['country'];

const PAGE_SIZE = 48;
const TOP_BRANDS = 12;

export function GoodsExplorer({ goods, characterNames }: GoodsExplorerProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [character, setCharacter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
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

  /**
   * 이름에 캐릭터가 안 적힌 굿즈가 많다. 「시사 인형」 은 그냥 「ぬいぐるみ」 로 올라온다.
   * 검색으로는 못 찾고 태그로만 찾을 수 있어서, 많이 나온 캐릭터부터 칩으로 세운다.
   */
  const characters = useMemo(() => {
    const count = new Map<string, number>();
    goods.forEach((g) => g.characters?.forEach((slug) => count.set(slug, (count.get(slug) ?? 0) + 1)));
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => ({ value: slug, label: characterNames[slug] ?? slug }));
  }, [goods, characterNames]);

  // 이름이 일본어뿐이라 한국어로 찾으면 안 나온다. 카테고리와 바꿔 쓰는 말까지 같이 본다.
  const index = useMemo(() => goods.map((g) => ({ goods: g, entry: searchEntry(g) })), [goods]);

  const filtered = useMemo(() => {
    const groups = searchTerms(query);
    const rows = index
      .map((row) => ({ ...row, score: groups.length === 0 ? 0 : searchScore(row.entry, groups) }))
      .filter(
        ({ goods: g, score }) =>
          score >= 0 &&
          (!country || g.country === country) &&
          (!brand || g.brand === brand) &&
          (!category || g.category === category) &&
          (!character || g.characters?.includes(character)) &&
          (!inStockOnly || stockState(g) !== 'soldout'),
      );
    // 찾는 말이 있을 때만 잘 맞는 순으로 세운다. 그냥 둘러볼 때는 최신순이 맞다.
    if (groups.length > 0) rows.sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length);
    return rows.map(({ goods: g }) => g);
  }, [index, country, brand, category, character, query, inStockOnly]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setLimit(PAGE_SIZE); };

  // 검색은 타자마다가 아니라 입력이 멈춘 뒤 한 번만 남긴다.
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (value: string) => {
    setQuery(value);
    setLimit(PAGE_SIZE);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => value.trim() && track('goods_search', { query: value.trim() }), 800));
  };

  return (
    <>
      <input
        className="search"
        type="search"
        placeholder="찾는 말을 띄어 쓰면 좁혀집니다 (예: 치이카와 인형)"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
      />
      <FilterChips options={[{ value: 'JP', label: '🇯🇵 일본' }, { value: 'KR', label: '🇰🇷 한국' }]} value={country} onChange={reset(setCountry)} />
      <FilterChips options={characters} value={character} onChange={reset(setCharacter)} allLabel="모든 캐릭터" />
      <FilterChips options={categories} value={category} onChange={reset(setCategory)} allLabel="모든 카테고리" />
      <FilterChips options={brands} value={brand} onChange={reset(setBrand)} allLabel="모든 브랜드" />
      <div className="chips" style={{ marginTop: -4 }}>
        <button
          className="chip"
          aria-pressed={inStockOnly}
          onClick={() => { setInStockOnly((v) => !v); setLimit(PAGE_SIZE); track('goods_instock_filter'); }}
        >
          지금 살 수 있는 것만
        </button>
        <span className="muted" style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
          {filtered.length.toLocaleString('ko-KR')}개
        </span>
      </div>
      <div className="grid">{filtered.slice(0, limit).map((g) => <GoodsCard key={g.id} goods={g} />)}</div>
      {filtered.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn soft" onClick={() => setLimit((l) => l + PAGE_SIZE)}>더 보기 ({(filtered.length - limit).toLocaleString('ko-KR')}개 남음)</button>
        </div>
      )}
    </>
  );
}
