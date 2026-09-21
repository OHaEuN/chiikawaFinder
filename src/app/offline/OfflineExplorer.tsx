'use client';

import { useMemo, useState } from 'react';
import type { Place, PlaceType } from '@/types/place';
import { PLACE_TYPE_LABEL } from '@/lib/labels';
import { isOngoing } from '@/lib/data';
import { FilterChips } from '@/components/FilterChips';
import { PlaceCard } from '@/components/PlaceCard';
import { PlacesMap } from '@/components/PlacesMap';

interface OfflineExplorerProps { places: Place[] }

type Country = 'KR' | 'JP';

const VIEW: Record<Country, { center: [number, number]; zoom: number }> = {
  KR: { center: [37.55, 126.98], zoom: 11 },
  JP: { center: [35.68, 139.76], zoom: 9 },
};
const ALL_VIEW = { center: [36.5, 132] as [number, number], zoom: 5 };

/**
 * 진행 중(곧 끝나는 순) → 상설 → 종료(최근에 끝난 순).
 * 묶음 번호와 날짜를 따로 돌려주고 숫자로 비교한다.
 */
function sortRank(place: Place): [number, number] {
  const end = place.period?.end;
  if (!end) return [1, 0];
  const date = Number(end.replaceAll('-', ''));
  return isOngoing(place) ? [0, date] : [2, -date];
}

const byRank = (a: Place, b: Place) => {
  const [groupA, dateA] = sortRank(a);
  const [groupB, dateB] = sortRank(b);
  return groupA - groupB || dateA - dateB;
};

export function OfflineExplorer({ places }: OfflineExplorerProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [type, setType] = useState<PlaceType | null>(null);
  const [onlyOngoing, setOnlyOngoing] = useState(true);

  const filtered = useMemo(
    () =>
      places
        .filter((p) => (!country || p.country === country) && (!type || p.type === type) && (!onlyOngoing || isOngoing(p)))
        // 곧 끝나는 것부터 보여 준다. 기간이 없는 상설 매장은 그 뒤, 끝난 것은 맨 뒤로 보낸다.
        .sort(byRank),
    [places, country, type, onlyOngoing],
  );
  const view = country ? VIEW[country] : ALL_VIEW;
  const typeOptions = (Object.keys(PLACE_TYPE_LABEL) as PlaceType[]).filter((t) => places.some((p) => p.type === t)).map((t) => ({ value: t, label: PLACE_TYPE_LABEL[t] }));

  return (
    <>
      <FilterChips options={[{ value: 'KR', label: '🇰🇷 한국' }, { value: 'JP', label: '🇯🇵 일본' }]} value={country} onChange={setCountry} />
      <FilterChips options={typeOptions} value={type} onChange={setType} />
      <div className="chips" style={{ marginTop: -8 }}>
        <button className="chip" aria-pressed={onlyOngoing} onClick={() => setOnlyOngoing((v) => !v)}>종료된 팝업 숨기기</button>
        <span className="muted" style={{ alignSelf: 'center', fontSize: '0.9rem' }}>{filtered.length}곳</span>
      </div>
      <PlacesMap key={country ?? 'all'} places={filtered} center={view.center} zoom={view.zoom} />
      <div className="grid grid-wide">{filtered.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
    </>
  );
}
