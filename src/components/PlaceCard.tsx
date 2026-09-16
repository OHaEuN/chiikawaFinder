import Link from 'next/link';
import type { Place } from '@/types/place';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { COUNTRY_LABEL, PLACE_EMOJI, PLACE_TYPE_LABEL } from '@/lib/labels';
import { isOngoing } from '@/lib/data';

interface PlaceCardProps { place: Place }

export function PlaceCard({ place }: PlaceCardProps) {
  const ongoing = isOngoing(place);
  return (
    <Link href={`/offline/${place.id}`} className="card">
      <div className="card-media">
        <SafeImage src={place.image} alt={place.name} fallback={PLACE_EMOJI[place.type]} seed={place.id} />
        <span className="card-badge"><Tag tone={place.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[place.country]} · {place.city}</Tag></span>
      </div>
      <div className="card-body">
        <div className="tags">
          <Tag tone="yellow">{PLACE_TYPE_LABEL[place.type]}</Tag>
          {place.period && <Tag tone={ongoing ? 'mint' : 'plain'}>{ongoing ? '진행 중' : '종료'}</Tag>}
          {!place.official && <Tag tone="lavender">비공식</Tag>}
        </div>
        <div className="card-title">{place.name}</div>
        <div className="card-sub">{place.sells.slice(0, 3).join(' · ')}</div>
        {place.priceRange && <div className="card-sub">{place.priceRange}</div>}
      </div>
    </Link>
  );
}
