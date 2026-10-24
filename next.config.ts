import type { NextConfig } from 'next';

/** 링크 미리보기는 절대 주소만 읽는다. 상대 경로로 두면 카카오톡·슬랙에서 썸네일이 안 뜬다. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chiikawa-finder.vercel.app/';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
};

export default nextConfig;
