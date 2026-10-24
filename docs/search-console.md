# 검색엔진에 사이트 올리기

사이트맵은 빌드할 때 자동으로 생긴다(`src/app/sitemap.ts`). 제출과 소유 확인만 사람이 한 번 하면 된다.

사이트는 `chiikawa-finder.vercel.app` 도메인 루트에서 서비스되어 `robots.txt` 도 루트에 있다.
소유 확인은 아래처럼 **메타 태그 방식**을 쓴다.

## 구글 서치콘솔

1. [search.google.com/search-console](https://search.google.com/search-console) → 속성 추가 → **URL 접두어** → `https://chiikawa-finder.vercel.app/`
2. 소유 확인에서 **HTML 태그**를 고르고 `content="..."` 안의 값만 복사
3. Vercel 프로젝트 Settings → **Environment Variables** → 추가
   - 이름 `NEXT_PUBLIC_GOOGLE_VERIFICATION`, 값은 2에서 복사한 것
4. Vercel Deployments 에서 최신 배포를 Redeploy 하고, 끝나면 서치콘솔에서 확인 누르기
5. 색인 생성 → Sitemaps 에 `sitemap.xml` 제출

## 네이버 서치어드바이저

같은 방식이다. [searchadvisor.naver.com](https://searchadvisor.naver.com) 에서 사이트 등록 →
HTML 태그 확인 → 값을 `NEXT_PUBLIC_NAVER_VERIFICATION` 변수에 넣는다.
등록 후 요청 → 사이트맵 제출에 `https://chiikawa-finder.vercel.app/sitemap.xml` 을 넣는다.

## 분석 붙이기

Vercel 프로젝트의 Analytics 탭에서 Web Analytics 를 켜면 된다. 코드는 이미 붙어 있다(`src/components/Analytics.tsx`).
