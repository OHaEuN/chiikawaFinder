# 검색엔진에 사이트 올리기

사이트맵과 robots 는 빌드할 때 자동으로 생긴다(`src/app/sitemap.ts`, `robots.ts`).
**2026-11-06 에 구글·네이버 모두 등록을 마쳤다.** 아래는 그때 실제로 밟은 절차와 막혔던 지점이다.

## 끝난 상태

| | |
|---|---|
| 주소 | https://chiikawa-finder.vercel.app/ (루트 도메인) |
| `sitemap.xml` | 2,425개 URL · 매일 수집 때 `lastmod` 갱신 |
| 구글 소유 확인 | 완료 (HTML 태그) |
| 구글 사이트맵 | 제출 완료 — 상태 **성공**, 발견된 페이지 2,425 |
| 네이버 소유 확인 | 완료 (HTML 태그) |
| 네이버 사이트맵 | 제출 완료 |
| Vercel Web Analytics | 켜져 있음 |

소유 확인 토큰 두 개는 Vercel 환경변수에 있다. 둘 다 `Config` 타입, Production.

```
NEXT_PUBLIC_GOOGLE_VERIFICATION
NEXT_PUBLIC_NAVER_VERIFICATION
```

`NEXT_PUBLIC_` 은 브라우저에 노출되는 값이라 Vercel 이 `Secret` 타입으로 저장하는 걸 막는다.
소유 확인 토큰은 어차피 HTML 에 그대로 실리는 값이라 `Config` 가 맞다.

## 막혔던 지점 세 가지

### 1. HTML 파일 방식은 쓸 수 없다

구글과 네이버 모두 `google....html` / `naver....html` 파일을 루트에 올리는 방식을 **먼저 권한다.
이 사이트에서는 안 된다.** `next.config.ts` 의 `trailingSlash: true` 때문에 Vercel 이 경로를
슬래시 형태로 정규화해서, 검색엔진이 확인하러 오는 주소에서 404 가 난다.

```
/google....html   404   ← 검색엔진이 요청하는 주소
/google..../      200   ← 실제로 서빙되는 주소
```

`trailingSlash` 는 사이트맵 2,425개 주소와 맞춰 둔 설정이라 이쪽을 끄는 게 훨씬 비싸다.
**메타 태그 방식만 쓴다**(`src/app/layout.tsx` 의 `verification`).

### 2. 환경변수를 넣었으면 반드시 재배포

`NEXT_PUBLIC_*` 은 빌드할 때 페이지에 박힌다. 변수만 넣고 재배포하지 않으면 머리말에 안 들어간다.
코드 변경이 없으므로 커밋 없이 Deployments → ⋯ → **Redeploy** 로 돌리면 된다.
반영까지 2분 정도 걸리니, 머리말에 태그가 보이는 걸 확인한 뒤에 소유확인 버튼을 누른다.

```bash
curl -s "https://chiikawa-finder.vercel.app/?cb=$RANDOM" | grep site-verification
```

### 3. 네이버 사이트맵은 전체 URL 을 넣어야 한다

입력칸 옆에 도메인이 적혀 있어 경로만 넣으면 될 것처럼 보이지만, 경로만 넣으면 조용히 거부된다
(빨간 밑줄만 생기고 아무 메시지가 없다).

```
sitemap.xml                                       거부
/sitemap.xml                                      거부
https://chiikawa-finder.vercel.app/sitemap.xml    통과
```

구글은 반대로 `sitemap.xml` 만 넣으면 된다.

또 네이버는 소유확인 단계에서 **자동 등록 방지 캡차**를 띄운다. 사람이 직접 입력해야 한다.

## 다시 할 일이 생기면

- 구글: [search.google.com/search-console](https://search.google.com/search-console) → 속성 추가 → **URL 접두어**(도메인 속성은 DNS 를 만져야 함) → HTML 태그 → 환경변수 → Redeploy → 확인 → Sitemaps
- 네이버: [searchadvisor.naver.com](https://searchadvisor.naver.com) → 사이트 등록 → HTML 태그 → 환경변수 → Redeploy → 소유확인(캡차) → 요청 → 사이트맵 제출

## 제출한 다음 볼 것

색인은 바로 안 된다. 구글은 며칠, 네이버는 더 걸린다.

- **색인 생성 > 페이지**: 색인된 수가 아니라 **제외된 이유**를 본다. "크롤링됨 - 현재 색인이 생성되지 않음"이 많으면 페이지가 서로 비슷하다는 뜻이다.
- **실적 > 검색어**: 어떤 말로 들어오는지. 여기 뜨는 말이 굿즈 검색 별칭 사전(`src/lib/search.ts`)에 넣을 말이다.

## 아직 남은 약점

굿즈 이름의 **30.8% 가 아직 일본어가 섞인 채**다(완전 한국어 69.2% · 1,585/2,289).
`lang="ko"` 인 페이지에 일본어 제목이 달려 있으면 한국어 검색에 잘 안 걸린다.

남은 것은 두 종류다.

| | 건수 | 어떻게 할까 |
|---|---|---|
| 괄호 밖에 일본어가 남음 | 422 | 채워야 할 몫. 긴 설명구(`ニードルフェルトでつくる`)와 일본 제품명(`はん蔵`)이 대부분 |
| 괄호 안 대사·의성어만 남음 | 282 | **일부러 둔다.** `「わーいわい」` 는 분위기라 옮기면 오히려 이상해진다 |

무엇부터 채울지는 짐작이 아니라 **검색어 데이터**로 정한다. 실제로 찾는 말부터
`src/lib/goods-name.ts` 에 넣는 게 순서가 맞다.
