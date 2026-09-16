# 데이터 소스 (스크래퍼용, 2026-09-16 확인)

## 치이카와 마켓 (Shopify) — 동작 확인 ✅

| 엔드포인트 | 비고 |
|---|---|
| `https://chiikawamarket.jp/products.json?limit=250&page=N` | N=1..10 확인 (총 2,500개 반환, 그 이상 페이지도 존재 가능). UA 헤더 필요 없음 |
| `https://chiikawamarket.jp/collections.json?limit=250` | 컬렉션 목록. handle 규칙: `YYYYMMDD`=발매일, `reYYYYMMDD`=재입고, `preYYYYMMDD`=예약 |
| `https://chiikawamarket.jp/collections/{handle}/products.json?limit=250` | 컬렉션별 상품 (예: `/collections/20260918/products.json`) |
| 상품 페이지 | `https://chiikawamarket.jp/products/{handle}` (handle = JAN 코드) |

### 필드
- `products[].title`, `handle`, `product_type` (일본어 카테고리: ぬいぐるみ/マスコット/キーホルダー/…)
- `products[].variants[].price` (문자열, 엔, 세금 포함), `variants[].available`
- `products[].images[].src` (cdn.shopify.com, 직접 사용 가능)
- `products[].tags` — **발매일은 태그로 판별**: `^\d{8}$` 태그 = 발매일(예 `20260508`), `RE\d{8}` = 재입고일. 캐릭터 태그: `ちいかわ, ハチワレ, うさぎ, モモンガ, くりまんじゅう, シーサー, ラッコ, 古本屋, あのこ, セイレーン, 鎧さん, カブトムシ`. 시리즈 태그: `映画ちいかわ, ちいかわパーク, まじかるちいかわ, ちいかわベーカリー` 등. `海外NG` = 해외 발송 불가
- ⚠️ `published_at`은 재공개 시 갱신되어 신뢰 불가(전 상품이 2026-02 이후로 표시). `created_at`은 대략 등록일. 발매일은 반드시 날짜 태그 사용

## 기타
- chiikawa-info.jp / 국내 채널의 기계 판독 엔드포인트는 `goods.json` 생성 시 조사 결과를 아래에 추가
