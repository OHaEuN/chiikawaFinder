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

export function OfflineExplorer({ places }: OfflineExplorerProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [type, setType] = useState<PlaceType | null>(null);
  const [onlyOngoing, setOnlyOngoing] = useState(true);

  const filtered = useMemo(
    () => places.filter((p) => (!country || p.country === country) && (!type || p.type === type) && (!onlyOngoing || isOngoing(p))),
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
