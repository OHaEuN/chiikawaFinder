import type { OnlineContent } from '@/types/online';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { COUNTRY_LABEL, ONLINE_CATEGORY_LABEL } from '@/lib/labels';

const REGION_TONE = { KR: 'pink', JP: 'blue', GLOBAL: 'lavender' } as const;

interface OnlineRowProps { item: OnlineContent }

export function OnlineRow({ item }: OnlineRowProps) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="row">
      <div className="row-thumb"><SafeImage src={item.image} alt={item.title} fallback="🔗" /></div>
      <div className="row-body">
        <div className="card-title">{item.title}</div>
        <div className="card-sub">{item.platform} · {item.description}</div>
        <div className="tags" style={{ marginTop: 6 }}>
          <Tag tone="yellow">{ONLINE_CATEGORY_LABEL[item.category]}</Tag>
          <Tag tone={REGION_TONE[item.region]}>{COUNTRY_LABEL[item.region]}</Tag>
          {item.free && <Tag tone="mint">무료</Tag>}
          {item.official && <Tag>공식</Tag>}
        </div>
      </div>
      <span className="muted" aria-hidden>↗</span>
    </a>
  );
}
