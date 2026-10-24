/**
 * 화면에서 일어난 일을 한 곳으로 모은다.
 *
 * Vercel Web Analytics 로 넘긴다. 사용자 정의 이벤트는 Vercel Pro 이상에서만 대시보드에 보인다.
 * 도구를 바꿔도 화면 코드는 그대로 두려고 이 얇은 층을 둔다.
 */
import { track as vercelTrack } from '@vercel/analytics';

type Props = Record<string, string | number | boolean>;

export function track(event: string, props: Props = {}): void {
  if (typeof window === 'undefined') return;
  try {
    vercelTrack(event, props);
  } catch {
    // 분석 실패가 화면을 멈추게 두지 않는다.
  }
}
