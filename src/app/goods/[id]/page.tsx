import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GOODS, characterName, findGoods } from '@/lib/data';
import { COUNTRY_LABEL } from '@/lib/labels';
import { SafeImage } from '@/components/SafeImage';
import { Tag } from '@/components/Tag';

interface PageProps { params: Promise<{ id: string }> }

export const generateStaticParams = () => GOODS.map((g) => ({ id: g.id }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const g = findGoods((await params).id);
  return { title: g ? g.name : '굿즈' };
}

export default async function GoodsDetailPage({ params }: PageProps) {
  const g = findGoods((await params).id);
  if (!g) notFound();
  return (
    <>
      <Link href="/goods" className="back">← 굿즈 목록</Link>
      <div className="detail-hero">
        <div className="card-media contain"><SafeImage src={g.image} alt={g.name} fallback="🎁" seed={g.id} /></div>
        <div>
          <div className="tags" style={{ marginBottom: 8 }}>
            <Tag tone={g.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[g.country]}</Tag>
            <Tag tone="yellow">{g.category}</Tag>
            {g.collab && <Tag tone="lavender">콜라보 · {g.collab}</Tag>}
          </div>
          <h1>{g.name}</h1>
          <p className="card-price" style={{ fontSize: '1.5rem' }}>{g.price}</p>
          <p>{g.description}</p>
          <dl className="kv">
            <dt>브랜드</dt><dd>{g.brand}</dd>
            <dt>발매일</dt><dd>{g.releaseDate}</dd>
            <dt>구매처</dt><dd>{g.buyAt}</dd>
            {g.characters.length > 0 && (
              <><dt>캐릭터</dt><dd className="tags">{g.characters.map((s) => <Link key={s} href={`/characters/${s}`} className="tag mint">{characterName(s)}</Link>)}</dd></>
            )}
          </dl>
          <div style={{ marginTop: 14 }}>
            <a className="btn" href={g.buyUrl} target="_blank" rel="noopener noreferrer">구매 페이지로 이동 ↗</a>
          </div>
        </div>
      </div>
      <section className="panel">
        <h2>출처</h2>
        <ul>{g.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', textDecoration: 'underline' }}>{s}</a></li>)}</ul>
      </section>
    </>
  );
}
