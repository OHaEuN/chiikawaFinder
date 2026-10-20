import Link from 'next/link';
import type { GoodsSummary } from '@/types/goods';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { COUNTRY_LABEL, shortDate } from '@/lib/labels';
import { STOCK_LABEL, stockState } from '@/lib/stock';
import { koreanName } from '@/lib/goods-name';

interface GoodsCardProps { goods: GoodsSummary }

export function GoodsCard({ goods }: GoodsCardProps) {
  const state = stockState(goods);
  const stockLabel = STOCK_LABEL[state];
  const name = koreanName(goods.name);
  return (
    <Link href={`/goods/${goods.id}`} className="card">
      <div className={`card-media contain${state === 'soldout' ? ' soldout' : ''}`}>
        <SafeImage src={goods.image} alt={name} fallback="🎁" seed={goods.id} width={200} />
        <span className="card-badge"><Tag tone={goods.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[goods.country]}</Tag></span>
        {stockLabel && <span className={`stock-mark stock-${state}`}>{stockLabel}</span>}
      </div>
      <div className="card-body">
        <div className="card-sub">{goods.collab ?? goods.brand} · {shortDate(goods.releaseDate)}</div>
        <div className="card-title">{name}</div>
        <div className="card-price">{goods.price}</div>
      </div>
    </Link>
  );
}
