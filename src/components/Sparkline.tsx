interface SparklineProps {
  values: number[];
  /** 그래프가 무엇을 그린 건지. 화면에는 안 보이고 읽어 주는 도구만 쓴다. */
  label: string;
  height?: number;
}

/**
 * 값이 어느 쪽으로 움직였는지만 보여 주는 작은 꺾은선.
 *
 * 차트 라이브러리를 하나 들이면 그 자체가 이 사이트에서 제일 무거운 코드가 된다.
 * 점 서른 개 잇는 데는 폴리라인 하나면 된다.
 *
 * 가로로 늘려 쓰므로 모양을 유지하지 않는다. 선 굵기만 늘어나지 않게 막는다.
 */
const WIDTH = 100;
const PAD = 3;

export function Sparkline({ values, label, height = 34 }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // 값이 하나로 평평하면 0으로 나누게 된다. 그때는 가운데 높이에 그린다.
  const span = max - min || 1;
  const inner = height - PAD * 2;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * WIDTH;
      const y = PAD + (1 - (value - min) / span) * inner;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg className="spark" viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
