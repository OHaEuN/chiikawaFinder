import type { NextConfig } from 'next';

/**
 * GitHub Pages 프로젝트 저장소는 https://<계정>.github.io/<저장소>/ 아래에서 서비스된다.
 * 로컬에서도 같은 경로를 쓰도록 조건 없이 켠다. 환경에 따라 달라지면 배포에서만 깨진다.
 */
const BASE_PATH = '/chiikawaFinder';
/** 링크 미리보기는 절대 주소만 읽는다. 상대 경로로 두면 카카오톡·슬랙에서 썸네일이 안 뜬다. */
const SITE_URL = `https://ohaeun.github.io${BASE_PATH}/`;

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: BASE_PATH,
  // 화면 코드가 src/lib/asset.ts 를 통해 같은 값을 읽는다.
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_SITE_URL: SITE_URL },
};

export default nextConfig;
