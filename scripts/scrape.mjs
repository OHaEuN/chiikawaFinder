import { readFile, writeFile } from 'node:fs/promises';
import { SHOP, assertYen, cutoffDate, latestActivity, mapProduct, mergeGoods } from './lib.mjs';

const OUT = new URL('../src/data/goods.json', import.meta.url);
const PAGE_SIZE = 250;
const MAX_PAGES = 20;

/**
 * currency 를 안 붙이면 Shopify 가 요청 지역을 보고 Global-e 환산가를 내려준다.
 * 한국에서 돌리면 원화 금액이 오는데 응답에 통화 표시가 없어 엔화처럼 보인다.
 */
async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${SHOP}/products.json?limit=${PAGE_SIZE}&page=${page}&currency=JPY`, { headers: { 'user-agent': 'Mozilla/5.0 chiikawa-finder' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} on page ${page}`);
    const { products } = await res.json();
    if (products.length === 0) break;
    all.push(...products);
  }
  return all;
}

const cutoff = cutoffDate();
const products = await fetchAllProducts();
assertYen(products);
// 발매일이 오래됐어도 최근 재입고됐으면 남긴다.
const scraped = products.map(mapProduct).filter((g) => latestActivity(g) >= cutoff);
const existing = JSON.parse(await readFile(OUT, 'utf8'));
const merged = mergeGoods(existing, scraped, cutoff);
await writeFile(OUT, JSON.stringify(merged, null, 2) + '\n');
console.log(`fetched ${products.length} products, ${scraped.length} within ${cutoff}~, total ${merged.length} goods`);
