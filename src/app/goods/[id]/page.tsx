import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GOODS, HISTORY, characterName, findGoods, parsePrice, yenPrice } from '@/lib/data';
import { COUNTRY_LABEL } from '@/lib/labels';
import { SafeImage } from '@/components/SafeImage';
import { Tag } from '@/components/Tag';
import { TrackedLink } from '@/components/TrackedLink';
import { GoodsTimeline } from '@/components/GoodsTimeline';
import { PriceTrend } from '@/components/PriceTrend';
import { restockCadence, restockHint } from '@/lib/restock';
import { fxSeries, goodsTimeline } from '@/lib/history';
import { STOCK_LABEL, stockState } from '@/lib/stock';
import { hasJapanese, koreanName } from '@/lib/goods-name';
import type { Goods } from '@/types/goods';

interface PageProps { params: Promise<{ id: string }> }

export const generateStaticParams = () => GOODS.map((g) => ({ id: g.id }));

const STOCK_SENTENCE: Record<ReturnType<typeof stockState>, string> = {
  available: '지금 살 수 있습니다.',
  soldout: '지금은 품절입니다.',
  upcoming: '아직 발매 전입니다.',
  unknown: '재고는 확인되지 않았습니다.',
};

/**
 * 굿즈가 2천 장이 넘는데 설명이 전부 같으면 검색엔진은 알맹이 없는 중복 문서로 보고 넘긴다.
 * 상품마다 다른 값으로 한 문장을 만든다.
 */
function goodsDescription(g: Goods): string {
  const name = koreanName(g.name);
  const cadence = restockCadence(g.restocks);
  const restock = cadence ? ` 지금까지 ${cadence.count}번 재입고됐습니다.` : '';
  return `${name} — ${g.price}, ${g.brand}, ${g.releaseDate} 발매. ${STOCK_SENTENCE[stockState(g)]}${restock} 원화로 얼마인지, 품절과 재입고가 언제였는지 함께 봅니다.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const g = findGoods((await params).id);
  if (!g) return { title: '굿즈' };
  const title = koreanName(g.name);
  const description = goodsDescription(g);
  // 링크를 공유했을 때 사이트 공용 그림 대신 그 상품이 보이게 한다.
  return {
    title,
    description,
    openGraph: { title, description, images: g.image ? [{ url: g.image, alt: title }] : undefined },
  };
}

const AVAILABILITY: Record<ReturnType<typeof stockState>, string> = {
  available: 'https://schema.org/InStock',
  soldout: 'https://schema.org/OutOfStock',
  upcoming: 'https://schema.org/PreOrder',
  unknown: 'https://schema.org/LimitedAvailability',
};

/**
 * 검색 결과에 값과 재고를 같이 띄우기 위한 구조화 데이터.
 * 파는 건 공식몰이라 offers.url 은 그 상품 페이지를 가리킨다.
 */
function productSchema(g: Goods) {
  const price = parsePrice(g.price);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: koreanName(g.name),
    alternateName: g.name,
    // 공식몰 소개문은 일본어다. 검색 결과에 뜨는 건 우리가 쓴 한국어 쪽이어야 한다.
    description: goodsDescription(g),
    ...(g.image ? { image: [g.image] } : {}),
    brand: { '@type': 'Brand', name: g.brand },
    releaseDate: g.releaseDate,
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            url: g.buyUrl,
            priceCurrency: price.currency,
            price: price.amount,
            availability: AVAILABILITY[stockState(g)],
            seller: { '@type': 'Organization', name: g.buyAt },
          },
        }
      : {}),
  });
}

export default async function GoodsDetailPage({ params }: PageProps) {
  const g = findGoods((await params).id);
  if (!g) notFound();
  const state = stockState(g);
  const name = koreanName(g.name);
  const soldOut = state === 'soldout';
  const hint = restockHint(g);
  const cadence = restockCadence(g.restocks);
  const timeline = goodsTimeline(HISTORY, g);
  const series = fxSeries(HISTORY);
  const priceYen = yenPrice(g.price);
  // 품절 상품을 담아 봐야 살 수 없다. 계산기에 넘기는 건 지금 살 수 있는 일본 상품만.
  const calculable = priceYen !== null && g.country === 'JP' && state === 'available';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productSchema(g) }} />
      <Link href="/goods" className="back">← 굿즈 목록</Link>
      <div className="detail-hero">
        <div className="card-media contain"><SafeImage src={g.image} alt={name} fallback="🎁" seed={g.id} width={340} /></div>
        <div>
          <div className="tags" style={{ marginBottom: 8 }}>
            <Tag tone={g.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[g.country]}</Tag>
            <Tag tone="yellow">{g.category}</Tag>
            {g.collab && <Tag tone="lavender">콜라보 · {g.collab}</Tag>}
            {STOCK_LABEL[state] && <Tag tone={state === 'upcoming' ? 'yellow' : 'plain'}>{STOCK_LABEL[state]}</Tag>}
            {state === 'available' && <Tag tone="mint">구매 가능</Tag>}
          </div>
          <h1>{name}</h1>
          {name !== g.name && <p className="muted original-name">공식몰 표기 {g.name}</p>}
          <p className="card-price" style={{ fontSize: '1.5rem' }}>{g.price}</p>
          {hasJapanese(g.description) && <p className="muted blurb-label">공식몰 소개문 (일본어 원문)</p>}
          <p className="goods-blurb">{g.description}</p>
          <dl className="kv">
            <dt>브랜드</dt><dd>{g.brand}</dd>
            <dt>발매일</dt><dd>{g.releaseDate}</dd>
            <dt>구매처</dt><dd>{g.buyAt}</dd>
            {cadence && (
              <>
                <dt>재입고</dt>
                <dd>
                  {cadence.count}회 · 마지막 {cadence.lastDate}
                  {cadence.averageGapDays ? ` · 평균 ${cadence.averageGapDays}일 간격` : ''}
                </dd>
              </>
            )}
            {g.characters.length > 0 && (
              <><dt>캐릭터</dt><dd className="tags">{g.characters.map((s) => <Link key={s} href={`/characters/${s}`} className="tag mint">{characterName(s)}</Link>)}</dd></>
            )}
          </dl>
          {hint && <p className={`restock restock-${hint.tone}`}>{hint.message}</p>}
          <div className="detail-actions">
            <TrackedLink
              className="btn"
              href={g.affiliateUrl ?? g.buyUrl}
              sponsored={Boolean(g.affiliateUrl)}
              event="goods_buy_click"
              props={{ id: g.id, brand: g.brand, country: g.country, affiliate: Boolean(g.affiliateUrl), soldOut }}
            >
              {state === 'available' ? '구매 페이지로 이동 ↗' : '상품 페이지 보기 ↗'}
            </TrackedLink>
            {calculable && (
              <Link className="btn soft" href={`/calculator?add=${g.id}`}>
                계산기에 담기
              </Link>
            )}
          </div>
        </div>
      </div>
      {g.affiliateUrl && (
        <div className="notice">
          이 페이지의 구매 링크에는 제휴 코드가 붙어 있어, 구매가 이뤄지면 사이트 운영자가 수수료를 받습니다.
          구매자가 내는 금액은 달라지지 않습니다.
        </div>
      )}

      {priceYen !== null && <PriceTrend priceYen={priceYen} series={series} />}

      <GoodsTimeline events={timeline} cadence={cadence} since={HISTORY.days[0]?.date ?? HISTORY.updatedAt} />

      <section className="panel">
        <h2>출처</h2>
        <ul>{g.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', textDecoration: 'underline' }}>{s}</a></li>)}</ul>
      </section>
    </>
  );
}
