import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charactersOf, cleanTitle, cutoffDate, isAvailable, latestActivity, mapProduct, mergeGoods, releaseDateOf, restocksOf } from './lib.mjs';

const product = {
  handle: '4571609401234',
  title: 'ちいかわ ハチワレ マスコット',
  published_at: '2026-09-11T18:52:56+09:00',
  created_at: '2026-05-08T09:52:56+09:00',
  product_type: 'マスコット',
  tags: ['20260925', 'RE20261101', 'RE20260601', 'ちいかわ', 'ハチワレ', 'マスコット', '海外NG'],
  body_html: '<p>ふわふわ<b>マスコット</b></p>',
  variants: [{ price: '2200', available: false }, { price: '1650', available: true }],
  images: [{ src: 'https://cdn/img.jpg' }],
};

test('발매일은 재입고 날짜가 아니라 원래 발매 태그에서 나온다', () => {
  assert.equal(releaseDateOf(product), '2026-09-25');
  assert.equal(releaseDateOf({ ...product, tags: ['20260401', 'RE20260610'] }), '2026-04-01');
  assert.equal(releaseDateOf({ ...product, tags: ['PRE20260513'] }), '2026-05-13');
  assert.equal(releaseDateOf({ ...product, tags: ['ちいかわ'] }), '2026-05-08');
});

test('캐릭터 태그만 slug로 변환한다', () => {
  assert.deepEqual(charactersOf(product), ['chiikawa', 'hachiware']);
});

test('mapProduct가 Shopify 상품을 Goods로 변환한다', () => {
  const g = mapProduct(product);
  assert.equal(g.id, 'cm-4571609401234');
  assert.equal(g.category, '인형/마스코트');
  assert.equal(g.releaseDate, '2026-09-25');
  assert.equal(g.available, true);
  assert.equal(g.price, '1,650엔');
  assert.equal(g.description, 'ふわふわ マスコット');
  assert.equal(g.buyUrl, 'https://chiikawamarket.jp/products/4571609401234');
});

test('품절 상품을 살 수 있는 것으로 보지 않는다', () => {
  assert.equal(isAvailable(product), true);
  assert.equal(isAvailable({ ...product, variants: [{ price: '1650', available: false }] }), false);
  assert.equal(isAvailable({ ...product, variants: [] }), false);
  assert.equal(isAvailable({}), false);
});

test('재입고 이력을 날짜순으로 모은다', () => {
  assert.deepEqual(restocksOf(product), ['2026-06-01', '2026-11-01']);
  assert.deepEqual(restocksOf({ ...product, tags: ['20260925'] }), []);
});

test('날짜가 아닌 8자리 태그는 버린다', () => {
  assert.deepEqual(restocksOf({ ...product, tags: ['RE23042111', 'RE20260601'] }), ['2026-06-01']);
  assert.deepEqual(restocksOf({ ...product, tags: ['RE20260230'] }), []);
});

test('오래전에 나왔어도 최근 재입고면 기간 안으로 본다', () => {
  const old = { releaseDate: '2024-01-01', lastRestockDate: '2026-09-01' };
  assert.equal(latestActivity(old), '2026-09-01');
  assert.equal(latestActivity({ releaseDate: '2026-09-01' }), '2026-09-01');
  const merged = mergeGoods([], [{ id: 'cm-a', ...old }], '2026-03-17');
  assert.equal(merged.length, 1);
});

test('재고와 재입고 이력을 상품에 담는다', () => {
  const g = mapProduct(product);
  assert.equal(g.available, true);
  assert.equal(g.restockCount, 2);
  assert.equal(g.lastRestockDate, '2026-11-01');
  assert.equal(mapProduct({ ...product, tags: ['20260925'] }).restockCount, 0);
  assert.equal('lastRestockDate' in mapProduct({ ...product, tags: ['20260925'] }), false);
});

test('mergeGoods는 수동 항목을 지키고 스크랩 항목을 교체하며 기간 지난 것을 버린다', () => {
  const existing = [
    { id: 'daewon-1', releaseDate: '2026-08-01' },
    { id: 'cm-old', releaseDate: '2026-07-01' },
    { id: 'daewon-expired', releaseDate: '2025-01-01' },
  ];
  const scraped = [{ id: 'cm-new', releaseDate: '2026-09-10' }];
  assert.deepEqual(mergeGoods(existing, scraped, '2026-03-16').map((g) => g.id), ['cm-new', 'daewon-1']);
});

test('상품명에서 중복되는 ちいかわ 접두사를 뗀다', () => {
  assert.equal(cleanTitle('ちいかわ ハチワレ マスコット'), 'ハチワレ マスコット');
  assert.equal(cleanTitle('ちいかわ'), 'ちいかわ');
  assert.equal(cleanTitle('まじかるちいかわ ステッカー'), 'まじかるちいかわ ステッカー');
});

test('cutoffDate는 6개월 전이다', () => {
  assert.equal(cutoffDate(new Date('2026-09-16T00:00:00Z')), '2026-03-16');
});
