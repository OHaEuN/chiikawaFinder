import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charactersOf, cutoffDate, mapProduct, mergeGoods, releaseDateOf } from './lib.mjs';

const product = {
  handle: '4571609401234',
  title: 'ちいかわ ハチワレ マスコット',
  published_at: '2026-09-11T18:52:56+09:00',
  created_at: '2026-05-08T09:52:56+09:00',
  product_type: 'マスコット',
  tags: ['20260925', 'ちいかわ', 'ハチワレ', 'マスコット', '海外NG'],
  body_html: '<p>ふわふわ<b>マスコット</b></p>',
  variants: [{ price: '2200' }, { price: '1650' }],
  images: [{ src: 'https://cdn/img.jpg' }],
};

test('releaseDate는 published_at이 아니라 날짜 태그에서 나온다', () => {
  assert.equal(releaseDateOf(product), '2026-09-25');
  assert.equal(releaseDateOf({ ...product, tags: ['PRE20260513'] }), '2026-05-13');
  assert.equal(releaseDateOf({ ...product, tags: ['20260401', 'RE20260610'] }), '2026-06-10');
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
  assert.equal(g.price, '1,650円(세금 포함)');
  assert.equal(g.description, 'ふわふわ マスコット');
  assert.equal(g.buyUrl, 'https://chiikawamarket.jp/products/4571609401234');
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

test('cutoffDate는 6개월 전이다', () => {
  assert.equal(cutoffDate(new Date('2026-09-16T00:00:00Z')), '2026-03-16');
});
