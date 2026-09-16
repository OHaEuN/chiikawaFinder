import { readFile, writeFile } from 'node:fs/promises';
import { SHOP, cutoffDate, mapProduct, mergeGoods, releaseDateOf } from './lib.mjs';

const OUT = new URL('../src/data/goods.json', import.meta.url);
const PAGE_SIZE = 250;
const MAX_PAGES = 20;

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${SHOP}/products.json?limit=${PAGE_SIZE}&page=${page}`, { headers: { 'user-agent': 'Mozilla/5.0 chiikawa-finder' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} on page ${page}`);
    const { products } = await res.json();
    if (products.length === 0) break;
    all.push(...products);
  }
  return all;
}

const cutoff = cutoffDate();
const products = await fetchAllProducts();
const scraped = products.filter((p) => releaseDateOf(p) >= cutoff).map(mapProduct);
const existing = JSON.parse(await readFile(OUT, 'utf8'));
const merged = mergeGoods(existing, scraped, cutoff);
await writeFile(OUT, JSON.stringify(merged, null, 2) + '\n');
console.log(`fetched ${products.length} products, ${scraped.length} within ${cutoff}~, total ${merged.length} goods`);
