import type { MetadataRoute } from 'next';
import { CHARACTERS, GOODS, HISTORY, PLACES } from '@/lib/data';

/**
 * 굿즈 상세만 2천 장이 넘는다. 검색엔진이 알아서 찾아 들어오기를 기다리면
 * 그 긴 꼬리는 영영 색인되지 않는다. 전부 적어 준다.
 *
 * 주소 끝의 / 는 next.config 의 trailingSlash 설정과 같아야 한다.
 * 다르면 색인된 주소와 실제 주소가 어긋나 중복 문서로 잡힌다.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiikawa-finder.vercel.app/';

const url = (path: string) => new URL(path, SITE_URL).toString();

/** 매일 긁는 페이지는 그 기록의 마지막 날을 수정일로 쓴다. */
const DATA_UPDATED = new Date(HISTORY.updatedAt || Date.now());

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: MetadataRoute.Sitemap = [
    { url: url('./'), changeFrequency: 'daily', priority: 1 },
    { url: url('today/'), lastModified: DATA_UPDATED, changeFrequency: 'daily', priority: 0.9 },
    { url: url('goods/'), lastModified: DATA_UPDATED, changeFrequency: 'daily', priority: 0.9 },
    { url: url('calendar/'), lastModified: DATA_UPDATED, changeFrequency: 'daily', priority: 0.8 },
    { url: url('calculator/'), lastModified: DATA_UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: url('watch/'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('offline/'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('offline/course/'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('online/'), changeFrequency: 'weekly', priority: 0.6 },
    { url: url('characters/'), changeFrequency: 'monthly', priority: 0.7 },
  ];

  return [
    ...fixed,
    ...CHARACTERS.map((c) => ({ url: url(`characters/${c.slug}/`), changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...PLACES.map((p) => ({ url: url(`offline/${p.id}/`), changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...GOODS.map((g) => ({
      url: url(`goods/${g.id}/`),
      lastModified: DATA_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}

/** 정적 내보내기에서는 요청 때마다 만들 수 없다. 빌드 시점에 한 번 굽는다. */
export const dynamic = 'force-static';
