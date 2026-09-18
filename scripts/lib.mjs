export const SHOP = 'https://chiikawamarket.jp';
export const SCRAPED_PREFIX = 'cm-';
export const WINDOW_MONTHS = 6;

/** 상품 태그의 일본어 캐릭터명 → 사이트 slug */
const CHARACTER_TAGS = {
  'ちいかわ': 'chiikawa',
  'ハチワレ': 'hachiware',
  'うさぎ': 'usagi',
  'モモンガ': 'momonga',
  'くりまんじゅう': 'kurimanju',
  'シーサー': 'shisa',
  'ラッコ': 'rakko',
  '古本屋': 'furuhonya',
  'あのこ': 'anoko',
  'セイレーン': 'seiren',
  '鎧さん': 'yoroi-san',
  'カブトムシ': 'kabutomushi',
};

/** product_type(일본어) → 사이트 카테고리 */
const CATEGORY_MAP = [
  [/ぬいぐるみ|マスコット|クッション/, '인형/마스코트'],
  [/キーホルダー|チャーム|ストラップ|アクリル/, '키링/참'],
  [/文房具|ステッカー|マステ|ノート|ペン|付箋/, '문구'],
  [/菓子|フード|食品|ドリンク|飲料/, '식품'],
  [/アパレル|Tシャツ|パーカー|靴下|ソックス|帽子|ウェア/, '의류'],
  [/フィギュア|プライズ|トレーディング/, '피규어/프라이즈'],
  [/タオル|ポーチ|バッグ|食器|マグ|ボトル|ハンカチ|雑貨/, '잡화'],
  [/寝具|インテリア|生活/, '생활용품'],
];

const RELEASE_TAG = /^(\d{8})$/;
const PREORDER_TAG = /^PRE(\d{8})$/;
const RESTOCK_TAG = /^RE(\d{8})$/;

export const cutoffDate = (today = new Date()) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - WINDOW_MONTHS);
  return d.toISOString().slice(0, 10);
};

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** 태그에 RE23042111 처럼 날짜가 아닌 8자리도 섞여 있다. 실제 날짜만 받는다. */
const toDate = (digits) => {
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso;
};

const datesFrom = (tags, pattern) =>
  tags
    .map((t) => pattern.exec(t)?.[1])
    .filter(Boolean)
    .map(toDate)
    .filter(Boolean)
    .sort();

/**
 * published_at은 재공개 시 갱신되어 신뢰할 수 없다. 발매일은 상품 태그의 8자리 날짜에서 뽑는다.
 * 재입고(RE)는 새 발매가 아니므로 제외한다. 재입고 이력은 restocksOf 가 따로 모은다.
 */
export const releaseDateOf = (product) => {
  const tags = product.tags ?? [];
  const released = datesFrom(tags, RELEASE_TAG);
  if (released.length) return released[0];
  const preorder = datesFrom(tags, PREORDER_TAG);
  if (preorder.length) return preorder[0];
  return (product.created_at ?? '').slice(0, 10);
};

export const guessCategory = (productType = '', title = '') => {
  const text = `${productType} ${title}`;
  return CATEGORY_MAP.find(([re]) => re.test(text))?.[1] ?? '기타';
};

export const charactersOf = (product) =>
  (product.tags ?? []).map((t) => CHARACTER_TAGS[t]).filter(Boolean);

/** 재고. 치이카와 마켓은 품절 상품도 페이지를 남겨 둬서 이 값이 없으면 살 수 있는 줄 안다. */
export const isAvailable = (product) => (product.variants ?? []).some((v) => v.available);

/** 재입고 이력. 태그에 RE + 8자리 날짜로 쌓인다. */
export const restocksOf = (product) => datesFrom(product.tags ?? [], RESTOCK_TAG);

/**
 * 엔화가 맞는지 확인한다. 환산가가 섞이면 통화 표시가 없어 그대로 엔으로 저장되고
 * 굿즈 가격과 직구 계산이 전부 어긋난다. 이 가게 물건값 중앙값은 천 엔대다.
 */
export const MAX_PLAUSIBLE_MEDIAN_YEN = 5000;

export const assertYen = (products) => {
  const prices = products.flatMap((p) => (p.variants ?? []).map((v) => Number(v.price))).filter(Boolean).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] ?? 0;
  if (median > MAX_PLAUSIBLE_MEDIAN_YEN) {
    throw new Error(`엔화가 아닌 값으로 보인다 (중앙값 ${median}). 지역 통화로 환산된 응답이다.`);
  }
};

/** 카드에서 한 줄에 들어가도록 짧게. 치이카와 마켓 표시가는 모두 세금 포함가다. */
export const formatYen = (price) => `${Number(price).toLocaleString('ja-JP')}엔`;

/** Shopify products.json 항목 → Goods */
/** 상품명이 거의 모두 "ちいかわ "로 시작해 카드에서 중복된다. 떼어 낸다. */
export const cleanTitle = (title = '') => title.replace(/^ちいかわ\s+/, '').trim() || title;

export const mapProduct = (p) => {
  const url = `${SHOP}/products/${p.handle}`;
  const restocks = restocksOf(p);
  const cheapest = [...p.variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
  return {
    id: `${SCRAPED_PREFIX}${p.handle}`,
    name: cleanTitle(p.title),
    brand: '치이카와 마켓',
    category: guessCategory(p.product_type, p.title),
    releaseDate: releaseDateOf(p),
    price: cheapest ? formatYen(cheapest.price) : '가격 미정',
    image: p.images[0]?.src,
    buyUrl: url,
    buyAt: '치이카와 마켓 온라인',
    country: 'JP',
    description: stripHtml(p.body_html).slice(0, 160) || p.title,
    characters: charactersOf(p),
    available: isAvailable(p),
    restockCount: restocks.length,
    ...(restocks.length ? { lastRestockDate: restocks.at(-1) } : {}),
    sources: [url],
  };
};

/**
 * 기간 안에 들었는지 판단할 때 쓰는 날짜.
 * 오래전에 나왔어도 최근에 재입고됐으면 지금 살 수 있는 상품이라 남긴다.
 * 재입고 정보가 팬들이 가장 찾는 정보인데, 발매일만 보면 전부 빠져 버린다.
 */
export const latestActivity = (goods) =>
  goods.lastRestockDate && goods.lastRestockDate > goods.releaseDate ? goods.lastRestockDate : goods.releaseDate;

/** 수동 큐레이션 항목은 유지, 스크랩 항목은 교체, 기간 지난 것은 제거, 최신순 정렬 */
export const mergeGoods = (existing, scraped, cutoff) =>
  [...existing.filter((g) => !g.id.startsWith(SCRAPED_PREFIX)), ...scraped]
    .filter((g) => latestActivity(g) >= cutoff)
    .sort((a, b) => latestActivity(b).localeCompare(latestActivity(a)));
