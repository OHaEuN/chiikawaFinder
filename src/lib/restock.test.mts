import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restockHint } from './restock.ts';

test('살 수 있는 상품에는 안내하지 않는다', () => {
  assert.equal(restockHint(5, '2026-06-01', true), null);
  assert.equal(restockHint(5, '2026-06-01', undefined), null);
});

test('재입고 이력이 없으면 알 수 없다고 말한다', () => {
  const hint = restockHint(0, undefined, false);
  assert.equal(hint?.tone, 'unknown');
  assert.match(hint!.message, /재입고된 적이 없는/);
});

test('세 번 넘게 재입고됐으면 기다려 볼 만하다고 한다', () => {
  const hint = restockHint(8, '2026-08-18', false, '2026-09-17');
  assert.equal(hint?.tone, 'likely');
  assert.match(hint!.message, /8번/);
  assert.match(hint!.message, /30일 전/);
});

test('한두 번이면 가능성만 알린다', () => {
  const hint = restockHint(2, '2026-09-10', false, '2026-09-17');
  assert.equal(hint?.tone, 'possible');
  assert.match(hint!.message, /7일 전/);
});

test('마지막 재입고일이 없으면 경과일을 말하지 않는다', () => {
  const hint = restockHint(4, undefined, false, '2026-09-17');
  assert.equal(hint?.tone, 'likely');
  assert.doesNotMatch(hint!.message, /일 전/);
});

test('재입고일이 미래면 경과일을 말하지 않는다', () => {
  const hint = restockHint(4, '2026-11-01', false, '2026-09-17');
  assert.doesNotMatch(hint!.message, /일 전/);
});
