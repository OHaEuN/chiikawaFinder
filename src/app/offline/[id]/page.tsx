import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLACES, findPlace, isOngoing } from '@/lib/data';
import { COUNTRY_LABEL, PLACE_EMOJI, PLACE_TYPE_LABEL } from '@/lib/labels';
import { SafeImage } from '@/components/SafeImage';
import { Tag } from '@/components/Tag';
import { TrackedLink } from '@/components/TrackedLink';
import { PlacesMap } from '@/components/PlacesMap';

interface PageProps { params: Promise<{ id: string }> }

const DETAIL_ZOOM = 15;

export const generateStaticParams = () => PLACES.map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = findPlace((await params).id);
  return { title: p ? p.name : '오프라인' };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const p = findPlace((await params).id);
  if (!p) notFound();
  const ongoing = isOngoing(p);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  return (
    <>
      <Link href="/offline" className="back">← 오프라인 목록</Link>
      <div className="detail-hero">
        <div className="card-media"><SafeImage src={p.image} alt={p.name} fallback={PLACE_EMOJI[p.type]} seed={p.id} /></div>
        <div>
          <div className="tags" style={{ marginBottom: 8 }}>
            <Tag tone={p.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[p.country]} · {p.city}</Tag>
            <Tag tone="yellow">{PLACE_TYPE_LABEL[p.type]}</Tag>
            {p.period && <Tag tone={ongoing ? 'mint' : 'plain'}>{ongoing ? '진행 중' : '종료'}</Tag>}
            {!p.official && <Tag tone="lavender">비공식</Tag>}
          </div>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <dl className="kv">
            <dt>주소</dt><dd>{p.address}</dd>
            {p.period && <><dt>기간</dt><dd>{p.period.start} ~ {p.period.end ?? '상시'}</dd></>}
            {p.hours && <><dt>영업시간</dt><dd>{p.hours}</dd></>}
            {p.priceRange && <><dt>가격대</dt><dd>{p.priceRange}</dd></>}
          </dl>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <TrackedLink className="btn" href={mapsUrl} event="place_directions" props={{ id: p.id, city: p.city }}>구글 지도로 길찾기</TrackedLink>
            {p.url && <a className="btn soft" href={p.url} target="_blank" rel="noopener noreferrer">공식 페이지 ↗</a>}
          </div>
        </div>
      </div>

      <PlacesMap places={[p]} center={[p.lat, p.lng]} zoom={DETAIL_ZOOM} className="map-mini" />

      <section className="panel">
        <h2>무엇을 파나요</h2>
        <div className="tags">{p.sells.map((s) => <Tag key={s} tone="pink">{s}</Tag>)}</div>
      </section>
      <section className="panel">
        <h2>출처</h2>
        <ul>{p.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', textDecoration: 'underline' }}>{s}</a></li>)}</ul>
      </section>
    </>
  );
}
