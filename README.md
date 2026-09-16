# 치이카와 파인더

치이카와 관련 정보를 인물 · 온라인 · 오프라인 · 굿즈 네 갈래로 모아 보여 주는 정적 사이트입니다.
아이보리 배경에 채도를 낮춘 파스텔 톤을 쓰고, 웹과 모바일 모두 대응합니다.

## 실행

```bash
pnpm install
pnpm dev      # 개발 서버
pnpm build    # out/ 에 정적 사이트 생성
pnpm start    # 생성된 정적 사이트 서빙
pnpm check    # 스크래퍼 로직 테스트
pnpm scrape   # 치이카와 마켓 신상 굿즈 갱신
```

## 구조

| 경로 | 내용 | 규모 |
|---|---|---|
| `src/data/characters.json` | 캐릭터 프로필과 등장 에피소드 | 45명 · 에피소드 581건 |
| `src/data/online.json` | 만화 · 애니 · 나가노 작가 작품을 볼 수 있는 경로와 링크 | 72건 |
| `src/data/places.json` | 한국 · 일본의 팝업, 매장, 카페, 콜라보 식당 (위경도 포함) | 50곳 |
| `src/data/goods.json` | 최근 6개월 굿즈. `cm-` 접두사는 스크래퍼가 채우고 나머지는 수동 | 2,007건 |
| `src/types/` | 네 데이터셋의 도메인 타입 | |
| `scripts/scrape.mjs` | 치이카와 마켓 신상 수집 | |
| `scripts/download-images.mjs` | 인물·장소 이미지를 `public/images` 로 내려받고 JSON을 로컬 경로로 교체 | |
| `scripts/merge-characters.mjs` | 인물 데이터 두 갈래를 slug 기준으로 합침 | |
| `scripts/sources.md` | 확인된 기계 판독 엔드포인트 정리 | |

## 이미지

인물과 장소 이미지는 `pnpm images` 로 파일을 내려받아 `public/images` 에 두고 로컬 경로로 참조합니다.
핫링크는 차단이나 CDN 만료로 조용히 깨지기 때문입니다. 굿즈는 2천 건이라 Shopify CDN을 그대로 씁니다.

인물 45명 중 37명에 사진이 있습니다. 나머지는 이름만 나오는 단역·괴물이라 공식 이미지도 굿즈도 없어
흰 배경에 파스텔 원으로 표시합니다.

## 굿즈 자동 갱신

`scripts/scrape.mjs` 가 치이카와 마켓의 Shopify `products.json` 을 읽어 최근 6개월 상품을 채웁니다.
발매일은 `published_at` 이 아니라 상품 태그의 8자리 날짜(`20260925`, `PRE20260513`, `RE20260601`)에서 뽑습니다.
`published_at` 은 상품이 다시 공개될 때 갱신되어 신뢰할 수 없기 때문입니다.

`cm-` 접두사가 붙은 항목만 스크래퍼가 덮어쓰고, 손으로 넣은 국내 굿즈는 그대로 둡니다.
`.github/workflows/scrape.yml` 이 매일 오전 6시(KST)에 돌면서 변경분을 커밋합니다.

## 지도

Leaflet + OpenStreetMap 타일을 씁니다. API 키가 필요 없습니다.
기본 타일은 채도가 높아 `.leaflet-tile-pane` 에 CSS 필터를 걸어 파스텔 톤에 맞췄습니다.
