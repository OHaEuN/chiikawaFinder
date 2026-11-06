'use client';

import { useMemo, useState } from 'react';
import type { GoodsSummary } from '@/types/goods';
import { FilterSelect } from '@/components/FilterSelect';
import { GoodsCard } from '@/components/GoodsCard';
import { track } from '@/lib/analytics';
import { searchEntry, searchScore, searchTerms } from '@/lib/search';
import { stockState } from '@/lib/stock';

interface GoodsExplorerProps {
  goods: GoodsSummary[];
  /** 슬러그로는 못 읽으니 이름이 필요하다. 데이터 전체를 번들에 끌고 오지 않으려고 화면에서 받는다. */
  characterNames: Record<string, string>;
}

const PAGE_SIZE = 48;
const TOP_BRANDS = 12;

const COUNTRY_LABEL: Record<string, string> = { JP: '🇯🇵 일본', KR: '🇰🇷 한국', GLOBAL: '🌏 글로벌' };

/** 많은 쪽부터 앞에 둔다. 한 건짜리를 맨 위에 두면 고를 거리가 아니라 목록이 된다. */
const byCount = (count: Map<string, number>) =>
  [...count.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, count: n }));

const countBy = <T,>(rows: T[], pick: (row: T) => string[] | string | undefined) => {
  const count = new Map<string, number>();
  rows.forEach((row) => {
    const keys = pick(row);
    (Array.isArray(keys) ? keys : [keys]).forEach((key) => {
      if (key) count.set(key, (count.get(key) ?? 0) + 1);
    });
  });
  return count;
};

export function GoodsExplorer({ goods, characterNames }: GoodsExplorerProps) {
  const [country, setCountry] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [character, setCharacter] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const countries = useMemo(
    () => byCount(countBy(goods, (g) => g.country)).map((o) => ({ ...o, label: COUNTRY_LABEL[o.value] ?? o.value })),
    [goods],
  );

  const brands = useMemo(
    () => byCount(countBy(goods, (g) => g.brand)).slice(0, TOP_BRANDS).map((o) => ({ ...o, label: o.value })),
    [goods],
  );

  const categories = useMemo(
    () => byCount(countBy(goods, (g) => g.category)).map((o) => ({ ...o, label: o.value })),
    [goods],
  );

  /**
   * 이름에 캐릭터가 안 적힌 굿즈가 많다. 「시사 인형」 은 그냥 「ぬいぐるみ」 로 올라온다.
   * 검색으로는 못 찾고 태그로만 찾을 수 있다.
   */
  const characters = useMemo(
    () => byCount(countBy(goods, (g) => g.characters)).map((o) => ({ ...o, label: characterNames[o.value] ?? o.value })),
    [goods, characterNames],
  );

  // 이름이 일본어뿐이라 한국어로 찾으면 안 나온다. 카테고리와 바꿔 쓰는 말까지 같이 본다.
  const index = useMemo(() => goods.map((g) => ({ goods: g, entry: searchEntry(g) })), [goods]);

  const filtered = useMemo(() => {
    const groups = searchTerms(query);
    const rows = index
      .map((row) => ({ ...row, score: groups.length === 0 ? 0 : searchScore(row.entry, groups) }))
      .filter(
        ({ goods: g, score }) =>
          score >= 0 &&
          (country.length === 0 || country.includes(g.country)) &&
          (brand.length === 0 || brand.includes(g.brand)) &&
          (category.length === 0 || category.includes(g.category)) &&
          (character.length === 0 || g.characters?.some((slug) => character.includes(slug))) &&
          (!inStockOnly || stockState(g) !== 'soldout'),
      );
    // 찾는 말이 있을 때만 잘 맞는 순으로 세운다. 그냥 둘러볼 때는 최신순이 맞다.
    if (groups.length > 0) rows.sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length);
    return rows.map(({ goods: g }) => g);
  }, [index, country, brand, category, character, query, inStockOnly]);

  const reset = (setter: (v: string[]) => void) => (v: string[]) => { setter(v); setLimit(PAGE_SIZE); };

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
      <div className="filters">
        <FilterSelect group="goods" label="캐릭터" allLabel="모든 캐릭터" options={characters} value={character} onChange={reset(setCharacter)} />
        <FilterSelect group="goods" label="분류" allLabel="모든 분류" options={categories} value={category} onChange={reset(setCategory)} />
        <FilterSelect group="goods" label="브랜드" allLabel="모든 브랜드" options={brands} value={brand} onChange={reset(setBrand)} />
        <FilterSelect group="goods" label="나라" allLabel="모든 나라" options={countries} value={country} onChange={reset(setCountry)} />
        <button
          className="chip"
          aria-pressed={inStockOnly}
          onClick={() => { setInStockOnly((v) => !v); setLimit(PAGE_SIZE); track('goods_instock_filter'); }}
        >
          지금 살 수 있는 것만
        </button>
        <span className="muted filters-count">{filtered.length.toLocaleString('ko-KR')}개</span>
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
