import type { FxPoint } from '@/lib/history';
import { Sparkline } from './Sparkline';

interface PriceTrendProps {
  priceYen: number;
  series: FxPoint[];
}

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

/**
 * 같은 상품이 날마다 원화로 얼마였는지.
 *
 * 엔화 표시가는 거의 그대로인데 원화로 내는 돈은 매일 움직인다.
 * "지금이 살 때인가"를 묻는 사람에게 필요한 건 정가가 아니라 이 폭이다.
 */
export function PriceTrend({ priceYen, series }: PriceTrendProps) {
  if (series.length < 2) return null;

  const values = series.map((p) => priceYen * p.krwPerJpy);
  const today = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const gap = max - min;

  return (
    <section className="panel">
      <h2>원화로 내는 값</h2>
      <div className="trend">
        <div className="trend-now">
          {won(today)}
          <small>오늘 {series[series.length - 1].date}</small>
        </div>
        <div className="trend-chart">
          <Sparkline values={values} label={`최근 ${series.length}일 원화 환산가 흐름`} />
          <div className="fx-scale">
            <span>가장 쌀 때 {won(min)}</span>
            <span>가장 비쌀 때 {won(max)}</span>
          </div>
        </div>
      </div>
      <p className="muted">
        {gap < 1
          ? `최근 ${series.length}일 동안 환율이 거의 움직이지 않았습니다.`
          : `최근 ${series.length}일 사이 가장 쌌을 때와 비쌌을 때가 ${won(gap)} 차이 납니다. 엔화 표시가는 그대로고, 환율만 움직인 결과입니다.`}
      </p>
    </section>
  );
}
