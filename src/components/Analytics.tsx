import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

/**
 * Vercel Web Analytics. Vercel 프로젝트에서 Analytics 를 켜 두면 방문자와 페이지뷰가 모인다.
 * 로컬 개발에서는 스크립트가 요청을 보내지 않는다.
 */
export function Analytics() {
  return <VercelAnalytics />;
}
