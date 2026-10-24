import type { NextConfig } from 'next';

/**
 * GitHub Pages 프로젝트 저장소는 https://<계정>.github.io/<저장소>/ 아래에서 서비스된다.
 * Vercel 은 도메인 루트에서 서비스하므로 하위 경로를 붙이지 않는다.
 * Vercel 빌드에는 VERCEL=1 이 자동으로 들어온다. 그 밖(로컬·GitHub Actions)은 Pages 와 같은 경로를 쓴다.
 */
const IS_VERCEL = process.env.VERCEL === '1';
const BASE_PATH = IS_VERCEL ? '' : '/chiikawaFinder';
/** 링크 미리보기는 절대 주소만 읽는다. 상대 경로로 두면 카카오톡·슬랙에서 썸네일이 안 뜬다. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (IS_VERCEL && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/`
    : `https://ohaeun.github.io${BASE_PATH}/`);

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: BASE_PATH,
  // 화면 코드가 src/lib/asset.ts 를 통해 같은 값을 읽는다.
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_SITE_URL: SITE_URL },
};

export default nextConfig;
