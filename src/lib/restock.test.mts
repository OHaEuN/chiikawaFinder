import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastRestock, restockCadence, restockCount, restockHint } from './restock.ts';

test('살 수 있는 상품에는 안내하지 않는다', () => {
  assert.equal(restockHint({ restocks: ['2026-06-01'], available: true }), null);
  assert.equal(restockHint({ restocks: ['2026-06-01'] }), null);
});

test('재입고 이력이 없으면 알 수 없다고 말한다', () => {
  const hint = restockHint({ available: false });
  assert.equal(hint?.tone, 'unknown');
  assert.match(hint!.message, /재입고된 적이 없는/);
});

test('세 번 넘게 재입고됐으면 기다려 볼 만하다고 한다', () => {
  const hint = restockHint({ restocks: ['2026-06-01', '2026-07-10', '2026-08-18'], available: false }, '2026-09-17');
  assert.equal(hint?.tone, 'likely');
  assert.match(hint!.message, /3번/);
  assert.match(hint!.message, /30일 전/);
  assert.match(hint!.message, /평균 39일/);
});

test('한두 번이면 가능성만 알린다', () => {
  const hint = restockHint({ restocks: ['2026-09-10'], available: false }, '2026-09-17');
  assert.equal(hint?.tone, 'possible');
  assert.match(hint!.message, /7일 전/);
  // 한 번만 들어온 상품은 주기를 말할 수 없다.
  assert.doesNotMatch(hint!.message, /평균/);
});

test('재입고일이 미래면 경과일을 말하지 않는다', () => {
  const hint = restockHint({ restocks: ['2026-11-01'], available: false }, '2026-09-17');
  assert.doesNotMatch(hint!.message, /일 전/);
});

test('재입고 주기는 처음과 마지막 사이를 횟수로 나눈 값이다', () => {
  const cadence = restockCadence(['2026-01-01', '2026-02-01', '2026-03-03']);
  assert.equal(cadence?.count, 3);
  assert.equal(cadence?.averageGapDays, 31);
  assert.equal(cadence?.firstDate, '2026-01-01');
  assert.equal(cadence?.lastDate, '2026-03-03');
});

test('한 번뿐이거나 없으면 주기를 말하지 않는다', () => {
  assert.equal(restockCadence(['2026-01-01'])?.averageGapDays, null);
  assert.equal(restockCadence([]), null);
  assert.equal(restockCadence(undefined), null);
});

test('순서가 섞여 들어와도 마지막 재입고일을 찾는다', () => {
  assert.equal(restockCadence(['2026-03-01', '2026-01-01'])?.lastDate, '2026-03-01');
  assert.equal(restockCount({ restocks: ['2026-01-01', '2026-03-01'] }), 2);
  assert.equal(restockCount({}), 0);
  assert.equal(lastRestock({ restocks: ['2026-01-01', '2026-03-01'] }), '2026-03-01');
  assert.equal(lastRestock({}), undefined);
});
