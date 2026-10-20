import type { Metadata } from 'next';
import { goodsSummaries } from '@/lib/data';
import { GoodsExplorer } from './GoodsExplorer';

export const metadata: Metadata = {
  title: '굿즈 신상',
  description:
    '치이카와 공식몰 굿즈를 매일 확인해 모았습니다. 일본어 상품명을 한국어로 바꿔 두어 인형·키링·문구를 한국어로 검색할 수 있고, 품절 여부와 가격을 함께 봅니다.',
};

export default function GoodsPage() {
  return (
    <>
      <div className="page-head">
        <h1>굿즈 신상</h1>
        <p>치이카와 마켓, 대원미디어, 콜라보 브랜드의 최근 6개월 신상 굿즈입니다. 가격과 구매처, 품절 여부를 함께 볼 수 있습니다.</p>
      </div>
      <GoodsExplorer goods={goodsSummaries()} />
    </>
  );
}
