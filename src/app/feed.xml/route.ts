import { HISTORY, goodsById, goodsSummaries } from '@/lib/data';
import { recentChanges } from '@/lib/history';
import { buildFeed, FEED_LIMIT } from '@/lib/feed';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiikawa-finder.vercel.app/';

/** 정적 내보내기에서는 요청 때마다 만들 수 없다. 빌드 시점에 한 번 굽는다. */
export const dynamic = 'force-static';

export function GET() {
  const days = recentChanges(HISTORY, goodsById(goodsSummaries()), FEED_LIMIT);
  return new Response(buildFeed(days, SITE_URL), {
    headers: { 'content-type': 'application/atom+xml; charset=utf-8' },
  });
}
