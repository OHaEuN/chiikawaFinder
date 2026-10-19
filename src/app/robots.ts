import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ohaeun.github.io/chiikawaFinder/';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('sitemap.xml', SITE_URL).toString(),
  };
}

/** 정적 내보내기에서는 요청 때마다 만들 수 없다. 빌드 시점에 한 번 굽는다. */
export const dynamic = 'force-static';
