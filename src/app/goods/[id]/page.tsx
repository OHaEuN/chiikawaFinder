import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GOODS, characterName, findGoods } from '@/lib/data';
import { COUNTRY_LABEL } from '@/lib/labels';
import { SafeImage } from '@/components/SafeImage';
import { Tag } from '@/components/Tag';
import { TrackedLink } from '@/components/TrackedLink';
import { restockHint } from '@/lib/restock';

interface PageProps { params: Promise<{ id: string }> }

export const generateStaticParams = () => GOODS.map((g) => ({ id: g.id }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const g = findGoods((await params).id);
  return { title: g ? g.name : '굿즈' };
}

export default async function GoodsDetailPage({ params }: PageProps) {
  const g = findGoods((await params).id);
  if (!g) notFound();
  const soldOut = g.available === false;
  const hint = restockHint(g.restockCount, g.lastRestockDate, g.available);
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
            {soldOut && <Tag>품절</Tag>}
            {g.available === true && <Tag tone="mint">구매 가능</Tag>}
          </div>
          <h1>{g.name}</h1>
          <p className="card-price" style={{ fontSize: '1.5rem' }}>{g.price}</p>
          <p>{g.description}</p>
          <dl className="kv">
            <dt>브랜드</dt><dd>{g.brand}</dd>
            <dt>발매일</dt><dd>{g.releaseDate}</dd>
            <dt>구매처</dt><dd>{g.buyAt}</dd>
            {g.restockCount ? (
              <><dt>재입고</dt><dd>{g.restockCount}회{g.lastRestockDate ? ` · 마지막 ${g.lastRestockDate}` : ''}</dd></>
            ) : null}
            {g.characters.length > 0 && (
              <><dt>캐릭터</dt><dd className="tags">{g.characters.map((s) => <Link key={s} href={`/characters/${s}`} className="tag mint">{characterName(s)}</Link>)}</dd></>
            )}
          </dl>
          {hint && <p className={`restock restock-${hint.tone}`}>{hint.message}</p>}
          <div style={{ marginTop: 14 }}>
            <TrackedLink
              className="btn"
              href={g.affiliateUrl ?? g.buyUrl}
              sponsored={Boolean(g.affiliateUrl)}
              event="goods_buy_click"
              props={{ id: g.id, brand: g.brand, country: g.country, affiliate: Boolean(g.affiliateUrl), soldOut }}
            >
              {soldOut ? '상품 페이지 보기 ↗' : '구매 페이지로 이동 ↗'}
            </TrackedLink>
          </div>
        </div>
      </div>
      {g.affiliateUrl && (
        <div className="notice">
          이 페이지의 구매 링크에는 제휴 코드가 붙어 있어, 구매가 이뤄지면 사이트 운영자가 수수료를 받습니다.
          구매자가 내는 금액은 달라지지 않습니다.
        </div>
      )}

      <section className="panel">
        <h2>출처</h2>
        <ul>{g.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', textDecoration: 'underline' }}>{s}</a></li>)}</ul>
      </section>
    </>
  );
}
