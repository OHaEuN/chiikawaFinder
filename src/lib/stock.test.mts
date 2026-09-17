import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stockState } from './stock.ts';

test('발매 전이면 품절이 아니라 발매 예정이다', () => {
  assert.equal(stockState({ releaseDate: '2026-10-02', available: false }, '2026-09-17'), 'upcoming');
  assert.equal(stockState({ releaseDate: '2026-10-02', available: true }, '2026-09-17'), 'upcoming');
});

test('발매 뒤에는 재고를 따른다', () => {
  assert.equal(stockState({ releaseDate: '2026-09-10', available: true }, '2026-09-17'), 'available');
  assert.equal(stockState({ releaseDate: '2026-09-10', available: false }, '2026-09-17'), 'soldout');
});

test('발매 당일은 예정이 아니다', () => {
  assert.equal(stockState({ releaseDate: '2026-09-17', available: false }, '2026-09-17'), 'soldout');
});

test('재고 정보가 없으면 단정하지 않는다', () => {
  assert.equal(stockState({ releaseDate: '2026-09-10' }, '2026-09-17'), 'unknown');
});
