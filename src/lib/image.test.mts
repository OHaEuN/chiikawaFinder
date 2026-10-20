import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canResize, imageSources } from './image.ts';

const SHOPIFY = 'https://cdn.shopify.com/s/files/1/0626/7142/1681/files/4550432346055_1.jpg?v=1791877020';
const OTHER = 'https://image.msscdn.net/images/goods_img/abc.jpg';

test('줄이기를 지원하는 주소에만 width 를 붙인다', () => {
  assert.equal(canResize(SHOPIFY), true);
  assert.equal(canResize(OTHER), false);
});

test('1배와 2배 두 벌을 만든다', () => {
  const { src, srcSet, sizes } = imageSources(SHOPIFY, 200);
  assert.ok(src.endsWith('&width=200'));
  assert.equal(srcSet, `${SHOPIFY}&width=200 200w, ${SHOPIFY}&width=400 400w`);
  assert.equal(sizes, '200px');
});

test('이미 ? 가 없는 주소면 ? 로 시작한다', () => {
  const plain = 'https://cdn.shopify.com/s/files/a.jpg';
  assert.ok(imageSources(plain, 100).src.endsWith('?width=100'));
});

test('줄이기를 지원하지 않으면 원본을 그대로 쓴다', () => {
  const { src, srcSet, sizes } = imageSources(OTHER, 200);
  assert.equal(src, OTHER);
  assert.equal(srcSet, undefined);
  assert.equal(sizes, undefined);
});
