import type { Metadata } from 'next';
import { GROUP_BUYS } from '@/lib/data';
import { GroupBuyCard } from '@/components/GroupBuyCard';

export const metadata: Metadata = { title: '공동구매' };

export default function GroupBuyPage() {
  return (
    <>
      <div className="page-head">
        <h1>공동구매</h1>
        <p>일본 치이카와 굿즈를 함께 사는 공구 정보를 모았어요. 배송비를 나눠 부담할 수 있습니다.</p>
      </div>

      {GROUP_BUYS.length === 0 ? (
        <div className="panel">
          <h2>아직 모은 공구가 없어요</h2>
          <p className="muted">진행 중인 공구를 찾는 대로 여기에 올립니다.</p>
        </div>
      ) : (
        <div className="grid grid-wide">
          {GROUP_BUYS.map((g) => <GroupBuyCard key={g.id} groupBuy={g} />)}
        </div>
      )}

      <div className="notice">
        <strong>공구 참여 전에 확인하세요.</strong> 이 페이지는 공개된 공구 정보를 모아 보여줄 뿐이고,
        결제와 배송에 관여하지 않습니다. 주최자와 직접 거래하는 것이므로 입금 전에 주최자의 과거 공구 이력을
        확인하고, 가능하면 안전거래를 쓰세요. 개인 간 송금은 문제가 생겨도 돌려받기 어렵습니다.
      </div>
    </>
  );
}
