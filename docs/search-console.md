# 검색엔진에 사이트 올리기

사이트맵은 빌드할 때 자동으로 생긴다(`src/app/sitemap.ts`). 제출과 소유 확인만 사람이 한 번 하면 된다.

## 왜 파일 방식이 안 되나

`ohaeun.github.io/chiikawaFinder/` 처럼 하위 경로에 올라가 있어 도메인 루트에 파일을 둘 수 없다.
크롤러는 `ohaeun.github.io/robots.txt` 만 읽는데 그 자리는 우리 것이 아니다.
그래서 소유 확인은 **메타 태그 방식**만 통하고, 사이트맵은 서치콘솔에 **주소를 직접 제출**해야 한다.
도메인을 붙이면 둘 다 한 번에 풀린다.

## 구글 서치콘솔

1. [search.google.com/search-console](https://search.google.com/search-console) → 속성 추가 → **URL 접두어** → `https://ohaeun.github.io/chiikawaFinder/`
2. 소유 확인에서 **HTML 태그**를 고르고 `content="..."` 안의 값만 복사
3. 레포 Settings → Secrets and variables → Actions → **Variables** 탭 → New variable
   - 이름 `NEXT_PUBLIC_GOOGLE_VERIFICATION`, 값은 2에서 복사한 것
4. Actions 에서 Deploy 를 다시 돌리고(새 커밋 없이 `workflow_dispatch` 로 충분하다) 배포가 끝나면 서치콘솔에서 확인 누르기
5. 색인 생성 → Sitemaps 에 `sitemap.xml` 제출

## 네이버 서치어드바이저

같은 방식이다. [searchadvisor.naver.com](https://searchadvisor.naver.com) 에서 사이트 등록 →
HTML 태그 확인 → 값을 `NEXT_PUBLIC_NAVER_VERIFICATION` 변수에 넣는다.
등록 후 요청 → 사이트맵 제출에 `https://ohaeun.github.io/chiikawaFinder/sitemap.xml` 을 넣는다.

## 분석 붙이기

[cloud.umami.is](https://cloud.umami.is) 에서 웹사이트를 추가하면 Website ID 가 나온다.
레포 Settings → Secrets and variables → Actions → **Secrets** 에
`NEXT_PUBLIC_UMAMI_ID` 로 넣으면 다음 배포부터 스크립트가 붙는다.
`src/lib/analytics.ts` 가 Umami·Plausible·GA 를 모두 받아 두었으니 도구를 바꿔도 화면 코드는 그대로다.
