import type { Metadata } from 'next';
import Link from 'next/link';
import { HISTORY, GOODS } from '@/lib/data';
import { asset } from '@/lib/asset';

export const metadata: Metadata = {
  title: '소개 · 운영 원칙',
  description:
    '치이카와 파인더가 무엇을 하고 무엇을 일부러 하지 않는지, 데이터를 어디서 언제 가져오는지, 일치마·중치마·마코 같은 말이 무슨 뜻인지.',
};

const REPO_URL = 'https://github.com/OHaEuN/chiikawaFinder';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiikawa-finder.vercel.app/';

/** 커뮤니티에서 쓰는 말. 처음 보는 사람은 이것부터 막힌다. */
const GLOSSARY: [string, string][] = [
  ['일치마 · 치이마 · 치마켓', '일본 치이카와 마켓(chiikawamarket.jp). 공식 온라인몰이고 이 사이트가 매일 확인하는 곳입니다.'],
  ['중치마', '중국 치이카와 마켓. 정식 라이선스 공식 매장이지만 한국 직배송이 자주 막힙니다. 타오바오 일반 판매자와는 다릅니다.'],
  ['용치마', '용산 아이파크몰 치이카와샵. 한국 상설 매장입니다.'],
  ['마코 · 누이', '마스코트(작은 인형) · 봉제인형(누이구루미).'],
  ['토벌', '일본 현지 굿즈 쇼핑 원정. 이 사이트의 토벌 코스는 도시별로 매장을 도는 순서입니다.'],
  ['무배컷', '일본 내 배송이 무료가 되는 최소 주문 금액. 치이카와 마켓은 1회 주문 11,000엔입니다.'],
  ['배대지', '배송대행지. 일본 주소로 받아 한국으로 보내 주는 업체입니다.'],
  ['공구', '공동구매. 한 사람이 모아서 주문하고 배송비를 나눕니다. 수수료는 보통 "적용 환율"에 섞여 있습니다.'],
  ['1차금 · 2차금', '공구에서 먼저 내는 상품값과, 물건이 도착한 뒤 정산하는 배송비.'],
  ['짭', '가품. 이 사이트는 가품 판별을 하지 않고 공식몰 링크만 싣습니다.'],
];

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <h1>소개 · 운영 원칙</h1>
        <p>치이카와 굿즈를 지금 살지, 기다릴지, 원화로 얼마인지 정하게 돕는 곳입니다. 무엇을 하고 무엇을 하지 않는지 적어 둡니다.</p>
      </div>

      <section className="panel">
        <h2>비공식 팬 사이트입니다</h2>
        <p>
          나가노 작가, 치이카와 마켓, 대원미디어와 관계가 없습니다. 상품 이미지는 공식몰이 공개한 주소를 그대로 보여 주고
          따로 저장하지 않습니다. 인물 이미지는 공식 사이트의 공개 이미지이며 출처를 적었습니다. 권리자가 요청하면 해당 자료를 내립니다.
        </p>
      </section>

      <section className="panel">
        <h2>데이터는 어디서, 언제</h2>
        <dl className="kv">
          <dt>굿즈</dt>
          <dd>치이카와 마켓 공개 목록을 매일 06:00(KST) 한 번 전부 읽습니다. 지금 {GOODS.length.toLocaleString('ko-KR')}건. 그사이에 들어왔다 나간 상품은 기록에 없습니다.</dd>
          <dt>변화</dt>
          <dd>어제 목록과 맞대어 신상·품절·재입고를 적습니다. {HISTORY.days[0]?.date ?? HISTORY.updatedAt}부터 {HISTORY.days.length}일째입니다. 그 앞의 품절은 보지 못했습니다.</dd>
          <dt>환율</dt>
          <dd>매일 원/엔을 받아 그날 기록에 적습니다. 상품값은 엔화로 고정이라 원화는 환율 하나로 전부 환산합니다.</dd>
          <dt>상품명</dt>
          <dd>번역 서비스를 쓰지 않고 사전으로 바꿉니다. 괄호 안 대사와 의성어는 일부러 두었고, 상세에 공식몰 원문을 같이 적습니다.</dd>
          <dt>인물 · 장소 · 볼 곳</dt>
          <dd>손으로 모았고 항목마다 출처를 적었습니다. 현장 대기·재고는 확인할 수단이 없어 싣지 않습니다.</dd>
          <dt>마지막 확인</dt>
          <dd>{HISTORY.updatedAt} 06:00 (KST)</dd>
        </dl>
      </section>

      <section className="panel">
        <h2>매일 변화를 받아 보려면</h2>
        <p>
          알림을 보내는 기능은 없습니다. 대신 Atom 피드가 있어, RSS 리더나 슬랙·디스코드의 피드 앱에 넣으면 어제와 달라진 것이 매일 들어옵니다.
        </p>
        <p><code>{SITE_URL}feed.xml</code></p>
        <a className="btn soft" href={asset('/feed.xml')}>피드 열기</a>
      </section>

      <section className="panel">
        <h2>일부러 하지 않는 것</h2>
        <dl className="kv">
          <dt>가품 판별</dt>
          <dd>판정이 틀리면 돈을 잃는데 판정할 근거 데이터가 없습니다. 구매 링크는 공식몰로만 보냅니다.</dd>
          <dt>개별 공구 모집글</dt>
          <dd>주최자를 검증할 수단이 없고, 사기 계정이 프로필만 바꿔 반복해서 엽니다. 공구가 열리는 플랫폼과 결제 보호 수준만 <Link href="/calculator">계산기</Link> 아래에 적습니다.</dd>
          <dt>시세 · 리셀가</dt>
          <dd>체결가 데이터가 없습니다.</dd>
          <dt>실시간 재고 · 알림 푸시</dt>
          <dd>하루 한 번 확인이 전부입니다. 결제와 배송에도 관여하지 않습니다.</dd>
        </dl>
      </section>

      <section className="panel">
        <h2>돈과 개인정보</h2>
        <p>
          광고가 없습니다. 상품에 제휴 링크가 있을 때만 그쪽으로 보내고 그 상품 페이지에 따로 적습니다(지금은 한 건도 없습니다).
          쿠키를 쓰지 않고 개인을 식별하지 않습니다. 브라우저에 남는 것은 계산기에 담은 상품과 조건, 고른 커서뿐입니다.
        </p>
      </section>

      <section className="panel">
        <h2>처음 보면 막히는 말</h2>
        <div className="table-wrap">
          <table className="table glossary">
            <thead><tr><th>말</th><th>뜻</th></tr></thead>
            <tbody>
              {GLOSSARY.map(([term, meaning]) => (
                <tr key={term}><td><strong>{term}</strong></td><td>{meaning}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>문의</h2>
        <p>
          틀린 정보, 내려 달라는 요청, 추가할 장소는{' '}
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>GitHub 이슈 ↗</a>
          로 받습니다. 코드와 데이터도 같은 곳에 공개돼 있습니다.
        </p>
      </section>
    </>
  );
}
