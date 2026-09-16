/**
 * 화면에서 일어난 일을 한 곳으로 모은다.
 *
 * 정적 사이트라 서버가 없어, 붙인 분석 도구가 있으면 그쪽으로 넘기고 없으면 아무것도 하지 않는다.
 * 도구를 바꿔도 화면 코드는 그대로 두려고 이 얇은 층을 둔다.
 */

type Props = Record<string, string | number | boolean>;

interface AnalyticsWindow extends Window {
  plausible?: (event: string, options?: { props: Props }) => void;
  gtag?: (command: 'event', event: string, props?: Props) => void;
  umami?: { track: (event: string, props?: Props) => void };
}

export function track(event: string, props: Props = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  try {
    w.plausible?.(event, { props });
    w.umami?.track(event, props);
    w.gtag?.('event', event, props);
  } catch {
    // 분석 실패가 화면을 멈추게 두지 않는다.
  }
}
