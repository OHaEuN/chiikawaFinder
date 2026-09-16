'use client';

import Link from 'next/link';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PlacesMapProps } from './PlacesMap';
import { PLACE_TYPE_LABEL } from '@/lib/labels';

const DEFAULT_CENTER: [number, number] = [36.5, 132];
const DEFAULT_ZOOM = 5;

const pin = (country: 'KR' | 'JP') =>
  L.divIcon({ className: '', html: `<div class="marker-pin ${country}"></div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28] });

export default function PlacesMapInner({ places, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, className = '' }: PlacesMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={`map ${className}`} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pin(p.country)}>
          <Popup>
            <strong>{p.name}</strong><br />
            <span style={{ color: '#9a8f84', fontSize: 12 }}>{PLACE_TYPE_LABEL[p.type]} · {p.city}</span><br />
            <Link href={`/offline/${p.id}`}>자세히 보기 →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
