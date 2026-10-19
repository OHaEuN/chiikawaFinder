import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendDay, diffDay, emptyHistory } from './history.mjs';

const goods = (id, available, releaseDate = '2026-10-10') => ({ id, available, releaseDate });

test('어제 있던 상품이 품절되면 그날 기록에 남는다', () => {
  const day = diffDay({
    date: '2026-10-13',
    previous: [goods('a', true), goods('b', false)],
    current: [goods('a', false), goods('b', true)],
    krwPerJpy: 8.4,
  });
  assert.deepEqual(day.soldOut, ['a']);
  assert.deepEqual(day.backInStock, ['b']);
  assert.deepEqual(day.added, []);
});

test('새로 올라온 상품만 신상으로 센다', () => {
  const day = diffDay({
    date: '2026-10-13',
    previous: [goods('a', true)],
    // 6개월 창에서 빠졌다가 재입고로 돌아온 옛날 상품은 신상이 아니다.
    current: [goods('a', true), goods('new', true, '2026-10-12'), goods('old', true, '2024-01-01')],
    krwPerJpy: 8.4,
  });
  assert.deepEqual(day.added, ['new']);
});

test('비교할 앞날이 없으면 전부 신상으로 보지 않는다', () => {
  const day = diffDay({ date: '2026-10-13', previous: [], current: [goods('a', true)], krwPerJpy: 8.4 });
  assert.deepEqual(day.added, []);
});

test('같은 날 다시 돌려도 기록이 겹치지 않는다', () => {
  const first = { date: '2026-10-13', krwPerJpy: 8.4, added: ['a'], soldOut: [], backInStock: [] };
  const again = { date: '2026-10-13', krwPerJpy: 8.5, added: ['a', 'b'], soldOut: [], backInStock: [] };
  const history = appendDay(appendDay(emptyHistory(), first), again);
  assert.equal(history.days.length, 1);
  assert.deepEqual(history.days[0].added, ['a', 'b']);
  assert.equal(history.updatedAt, '2026-10-13');
});

test('창 밖으로 나간 날은 버린다', () => {
  const day = (date) => ({ date, krwPerJpy: 8.4, added: [], soldOut: [], backInStock: [] });
  const history = [day('2026-01-01'), day('2026-10-10'), day('2026-10-13')].reduce(
    (acc, d) => appendDay(acc, d, 30),
    emptyHistory(),
  );
  assert.deepEqual(history.days.map((d) => d.date), ['2026-10-10', '2026-10-13']);
});
