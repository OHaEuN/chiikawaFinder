import Link from 'next/link';
import type { GoodsSummary } from '@/types/goods';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { COUNTRY_LABEL, shortDate } from '@/lib/labels';
import { STOCK_LABEL, stockState } from '@/lib/stock';

interface GoodsCardProps { goods: GoodsSummary }

export function GoodsCard({ goods }: GoodsCardProps) {
  const state = stockState(goods);
  const stockLabel = STOCK_LABEL[state];
  return (
    <Link href={`/goods/${goods.id}`} className="card">
      <div className={`card-media contain${state === 'soldout' ? ' soldout' : ''}`}>
        <SafeImage src={goods.image} alt={goods.name} fallback="🎁" seed={goods.id} />
        <span className="card-badge"><Tag tone={goods.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[goods.country]}</Tag></span>
        {stockLabel && <span className={`stock-mark stock-${state}`}>{stockLabel}</span>}
      </div>
      <div className="card-body">
        <div className="card-sub">{goods.collab ?? goods.brand} · {shortDate(goods.releaseDate)}</div>
        <div className="card-title">{goods.name}</div>
        <div className="card-price">{goods.price}</div>
      </div>
    </Link>
  );
}
