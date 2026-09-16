import type { Metadata } from 'next';
import { goodsSummaries } from '@/lib/data';
import { GoodsExplorer } from './GoodsExplorer';

export const metadata: Metadata = { title: '굿즈 신상' };

export default function GoodsPage() {
  return (
    <>
      <div className="page-head">
        <h1>굿즈 신상</h1>
        <p>치이카와 마켓, 대원미디어, 콜라보 브랜드의 최근 6개월 신상 굿즈입니다. 가격과 구매처를 함께 확인하세요.</p>
      </div>
      <GoodsExplorer goods={goodsSummaries()} />
    </>
  );
}
