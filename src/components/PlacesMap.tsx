'use client';

import dynamic from 'next/dynamic';
import type { Place } from '@/types/place';

export interface PlacesMapProps {
  places: Place[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const LazyMap = dynamic(() => import('./PlacesMapInner'), { ssr: false, loading: () => <div className="map ph" style={{ fontSize: '1rem' }}>지도를 불러오는 중…</div> });

export function PlacesMap(props: PlacesMapProps) {
  return <LazyMap {...props} />;
}
