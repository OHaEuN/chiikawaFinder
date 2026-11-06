# 검색엔진에 사이트 올리기

사이트맵과 robots 는 빌드할 때 자동으로 생긴다(`src/app/sitemap.ts`, `robots.ts`).
**사람이 할 일은 소유 확인과 제출 한 번뿐이다.**

## 지금 상태 (2026-11-06 실측)

| | |
|---|---|
| 주소 | https://chiikawa-finder.vercel.app/ (루트 도메인) |
| `robots.txt` | 전체 허용 + 사이트맵 주소 명시 |
| `sitemap.xml` | **2,425개 URL**, 매일 수집 때 `lastmod` 갱신 |
| 굿즈 상세 | 페이지마다 다른 설명 + `Product` 구조화 데이터(가격·통화·재고·판매자) |
| 공유 이미지 | 상품 이미지, 없으면 `/og.png` |
| 소유 확인 | **아직 안 함** ← 남은 일 |

## 1. 구글 서치콘솔

1. [search.google.com/search-console](https://search.google.com/search-console) → 속성 추가 → **URL 접두어**
   - `https://chiikawa-finder.vercel.app/` (끝 슬래시까지)
   - 도메인 속성은 DNS 를 만져야 하므로 쓰지 않는다
2. 소유 확인 → **HTML 태그** → `content="..."` 안의 값만 복사
3. Vercel → 프로젝트 → Settings → **Environment Variables**
   - Key `NEXT_PUBLIC_GOOGLE_VERIFICATION`, Value 는 2에서 복사한 것, Environment 는 **Production**
4. Deployments → 맨 위 배포 → ⋯ → **Redeploy**
   - `NEXT_PUBLIC_*` 은 빌드할 때 페이지에 박힌다. 변수만 넣고 재배포하지 않으면 머리말에 안 들어간다
5. 배포가 끝나면 서치콘솔로 돌아가 **확인**
6. 색인 생성 → **Sitemaps** → `sitemap.xml` 제출

## 2. 네이버 서치어드바이저

치이카와 굿즈를 찾는 사람 상당수가 네이버에서 검색한다. 구글만큼 중요하다.

1. [searchadvisor.naver.com](https://searchadvisor.naver.com) → 웹마스터 도구 → 사이트 등록
   - `https://chiikawa-finder.vercel.app/`
2. 소유 확인 → **HTML 태그** → 값만 복사
3. Vercel 환경변수 `NEXT_PUBLIC_NAVER_VERIFICATION` 에 넣고 다시 Redeploy
   - 구글 값을 먼저 넣어 뒀다면 두 개를 같이 넣고 재배포를 한 번만 해도 된다
4. 소유 확인 → 요청 → **사이트맵 제출** 에 `https://chiikawa-finder.vercel.app/sitemap.xml`

## 3. 분석 켜기

Vercel 프로젝트 → Analytics 탭 → Web Analytics 활성화. 코드는 이미 붙어 있다(`src/components/Analytics.tsx`).

## 제출한 다음

색인은 바로 안 된다. 구글은 며칠, 네이버는 더 걸린다. 볼 것은 두 가지다.

- **색인 생성 > 페이지**: 색인된 수가 아니라 **제외된 이유**를 본다. "크롤링됨 - 현재 색인이 생성되지 않음"이 많으면 페이지가 서로 비슷하다는 뜻이다.
- **실적 > 검색어**: 어떤 말로 들어오는지. 여기 뜨는 말이 굿즈 검색의 별칭 사전에 넣을 말이다.

## 아직 남은 약점

굿즈 이름의 **44% 가 아직 일본어가 섞인 채**다(완전 한국어 56%).
`lang="ko"` 인 페이지에 일본어 제목이 달려 있으면 한국어 검색에 잘 안 걸린다.
색인이 들어오기 시작한 뒤 검색어 데이터를 보고, 실제로 찾는 말부터 사전(`src/lib/goods-name.ts`)에 채우는 게 다음 작업이다.
