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

const DATE_TAG = /^(?:PRE|RE)?(\d{8})$/;

export const cutoffDate = (today = new Date()) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - WINDOW_MONTHS);
  return d.toISOString().slice(0, 10);
};

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * published_at은 재공개 시 갱신되어 신뢰할 수 없다.
 * 발매일은 상품 태그의 8자리 날짜(20260925 / PRE20260513 / RE20260601)에서 뽑는다.
 */
export const releaseDateOf = (product) => {
  const dates = (product.tags ?? [])
    .map((t) => DATE_TAG.exec(t)?.[1])
    .filter(Boolean)
    .map((d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`)
    .sort();
  return dates.at(-1) ?? (product.created_at ?? '').slice(0, 10);
};

export const guessCategory = (productType = '', title = '') => {
  const text = `${productType} ${title}`;
  return CATEGORY_MAP.find(([re]) => re.test(text))?.[1] ?? '기타';
};

export const charactersOf = (product) =>
  (product.tags ?? []).map((t) => CHARACTER_TAGS[t]).filter(Boolean);

export const formatYen = (price) => `${Number(price).toLocaleString('ja-JP')}円(세금 포함)`;

/** Shopify products.json 항목 → Goods */
export const mapProduct = (p) => {
  const url = `${SHOP}/products/${p.handle}`;
  const cheapest = [...p.variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
  return {
    id: `${SCRAPED_PREFIX}${p.handle}`,
    name: p.title,
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
    sources: [url],
  };
};

/** 수동 큐레이션 항목은 유지, 스크랩 항목은 교체, 기간 지난 것은 제거, 최신순 정렬 */
export const mergeGoods = (existing, scraped, cutoff) =>
  [...existing.filter((g) => !g.id.startsWith(SCRAPED_PREFIX)), ...scraped]
    .filter((g) => g.releaseDate >= cutoff)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
