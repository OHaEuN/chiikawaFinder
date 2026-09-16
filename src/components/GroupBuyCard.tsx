import type { GroupBuy } from '@/types/groupbuy';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { GROUPBUY_CHANNEL_LABEL, GROUPBUY_STATUS_LABEL } from '@/lib/labels';

interface GroupBuyCardProps { groupBuy: GroupBuy }

const STATUS_TONE = { open: 'mint', shipping: 'blue', closed: 'plain', done: 'plain' } as const;

export function GroupBuyCard({ groupBuy }: GroupBuyCardProps) {
  return (
    <a href={groupBuy.url} target="_blank" rel="noopener noreferrer" className="card">
      <div className="card-media">
        <SafeImage src={groupBuy.image} alt={groupBuy.title} fallback="🛍️" seed={groupBuy.id} />
        <span className="card-badge">
          <Tag tone={STATUS_TONE[groupBuy.status]}>{GROUPBUY_STATUS_LABEL[groupBuy.status]}</Tag>
        </span>
      </div>
      <div className="card-body">
        <div className="card-sub">{groupBuy.organizer} · {GROUPBUY_CHANNEL_LABEL[groupBuy.channel]}</div>
        <div className="card-title">{groupBuy.title}</div>
        {groupBuy.deadline && <div className="card-sub">마감 {groupBuy.deadline}</div>}
        {groupBuy.fee && <div className="card-price">수수료 {groupBuy.fee}</div>}
      </div>
    </a>
  );
}
