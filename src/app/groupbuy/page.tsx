import type { Metadata } from 'next';
import { GROUPBUY_CHANNELS } from '@/lib/data';
import { GROUPBUY_SAFETY_LABEL } from '@/lib/labels';
import { Tag } from '@/components/Tag';

export const metadata: Metadata = { title: '공동구매' };

const SAFETY_TONE = { safer: 'mint', caution: 'yellow', risky: 'pink' } as const;

/** 치이카와 마켓 공식 이용안내 기준, 1회 주문 이 금액 이상이면 일본 내 배송 무료 */
const FREE_DOMESTIC_SHIPPING_YEN = 11000;

const CHECKLIST = [
  '표시명이 아니라 계정 아이디와 가입 시기를 확인하세요. 사기 계정은 닉네임과 프로필 사진만 바꿔 공구를 다시 엽니다.',
  '주최자의 과거 공구 후기가 실제로 있는지 찾아보세요. 신규 계정의 첫 공구는 피하는 편이 안전합니다.',
  '안전결제를 지원하는 곳이면 계좌이체 대신 안전결제를 고르세요.',
  '한정 수량 발매 직전에 사기가 몰립니다. 1인 구매 제한이 걸린 상품을 여러 개 구해 준다는 공구는 의심하세요.',
  '반값택배나 오픈채팅 개인 연락으로 옮기자고 하면 거래를 멈추세요.',
  '입금 내역, 공구 모집글, 대화 캡처를 남겨 두세요. 문제가 생기면 더치트와 경찰 신고에 필요합니다.',
];

export default function GroupBuyPage() {
  return (
    <>
      <div className="page-head">
        <h1>공동구매</h1>
        <p>일본 치이카와 굿즈 공구가 어디서 열리고, 돈이 어떻게 나뉘고, 무엇을 조심해야 하는지 모았어요.</p>
      </div>

      <section className="panel">
        <h2>공구를 하는 이유</h2>
        <p>
          치이카와 마켓은 대부분의 상품을 해외로 보내 줍니다. 공구의 진짜 목적은 <strong>배송비를 나누는 것</strong>입니다.
          혼자 마스코트 하나를 주문하면 해외배송비가 상품값에 맞먹지만, 여럿이 묶으면 인당 부담이 줄어듭니다.
        </p>
        <p className="muted">
          치이카와 마켓은 1회 주문이 {FREE_DOMESTIC_SHIPPING_YEN.toLocaleString('ko-KR')}엔 이상이면 일본 내 배송비가 무료입니다.
          공구 모집글의 &lsquo;무배컷&rsquo;이 이 기준입니다.
        </p>
      </section>

      <section className="panel">
        <h2>돈은 두 번 나눠 냅니다</h2>
        <dl className="kv">
          <dt>1차금</dt>
          <dd>상품값입니다. 엔화 가격에 주최자가 정한 환율을 곱합니다. 공구 마감 때 먼저 입금합니다.</dd>
          <dt>2차금</dt>
          <dd>해외배송비를 참여 인원으로 나눈 몫과 국내 택배비입니다. 물건이 한국에 도착한 뒤 정산합니다.</dd>
          <dt>수수료</dt>
          <dd>따로 적지 않고 환율에 넣는 경우가 대부분입니다. 엔당 9.5원이나 10원처럼 실제 환율보다 조금 높게 잡습니다.</dd>
        </dl>
      </section>

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

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>입금 전에 확인할 것</h2>
        <ol className="checklist">{CHECKLIST.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <div className="notice">
        이 페이지는 특정 주최자를 추천하지 않습니다. 개별 공구는 주최자와 직접 거래하는 것이고, 이 사이트는 결제와 배송에 관여하지 않습니다.
        개인 계좌로 보낸 돈은 문제가 생겨도 돌려받기 어렵습니다.
      </div>
    </>
  );
}
