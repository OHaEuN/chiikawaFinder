import type { Metadata } from 'next';
import { FX, GOODS, GROUPBUY_CHANNELS, yenPrice } from '@/lib/data';
import { GROUPBUY_SAFETY_LABEL } from '@/lib/labels';
import { Tag } from '@/components/Tag';
import { CostCalculator } from './CostCalculator';

export const metadata: Metadata = {
  title: '직구 계산기',
  description: '치이카와 굿즈를 직구하거나 공구로 살 때 최종 얼마인지, 공구 환율에 수수료가 얼마나 섞였는지 계산합니다.',
};

const SAFETY_TONE = { safer: 'mint', caution: 'yellow', risky: 'pink' } as const;

export default function CalculatorPage() {
  // 품절 상품을 담아 봐야 살 수 없다. 재고가 있는 일본 상품만 후보로 둔다.
  const options = GOODS.flatMap((g) => {
    const priceYen = yenPrice(g.price);
    const usable = priceYen && g.country === 'JP' && g.available;
    return usable ? [{ id: g.id, name: g.name, priceYen, image: g.image }] : [];
  });

  return (
    <>
      <div className="page-head">
        <h1>직구 계산기</h1>
        <p>담아 보면 최종 얼마인지 바로 나옵니다. 공구 환율을 넣으면 수수료가 얼마나 섞였는지도 보입니다.</p>
      </div>

      <CostCalculator options={options} marketRate={FX.krwPerJpy} usdPerJpy={FX.usdPerJpy} rateUpdatedAt={FX.updatedAt} />

      <div className="section-head"><h2>공구가 열리는 곳</h2></div>
      <div className="stack">
        {GROUPBUY_CHANNELS.map((c) => (
          <article key={c.id} className="panel channel">
            <div className="channel-head">
              <h3>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.name} ↗</a> : c.name}</h3>
              <Tag tone={SAFETY_TONE[c.safety]}>{GROUPBUY_SAFETY_LABEL[c.safety]}</Tag>
            </div>
            <p>{c.description}</p>
            <p className="channel-safety">{c.safetyNote}</p>
          </article>
        ))}
      </div>

      <div className="notice">
        세금은 예상치입니다. 실제 과세는 같은 날 들어온 다른 주문과 합산될 수 있고, 품목 분류에 따라 세율이 달라집니다.
        개별 공구를 추천하지 않으며, 결제와 배송에 관여하지 않습니다. 계산 근거는 docs/import-cost.md 에 정리해 두었습니다.
      </div>
    </>
  );
}
