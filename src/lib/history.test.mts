import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fxSeries, fxVerdict, goodsTimeline, recentChanges, sellOutDays } from './history.ts';
import type { History } from '../types/history.ts';
import type { GoodsSummary } from '../types/goods.ts';

const day = (date: string, krwPerJpy: number, rest: Partial<History['days'][number]> = {}) => ({
  date,
  krwPerJpy,
  added: [],
  soldOut: [],
  backInStock: [],
  ...rest,
});

const history: History = {
  updatedAt: '2026-10-05',
  days: [
    day('2026-10-01', 8.8),
    day('2026-10-02', 8.6, { soldOut: ['a'] }),
    day('2026-10-03', 0),
    day('2026-10-04', 8.5, { backInStock: ['a'], added: ['b'] }),
    day('2026-10-05', 8.4, { soldOut: ['a'] }),
  ],
};

test('환율을 못 받아온 날은 그래프에서 뺀다', () => {
  assert.deepEqual(fxSeries(history).map((p) => p.date), ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05']);
});

test('가장 싼 날이면 그렇게 말한다', () => {
  const verdict = fxVerdict(fxSeries(history));
  assert.equal(verdict?.tone, 'good');
  assert.equal(verdict?.cheaperDays, 0);
  assert.match(verdict!.message, /가장 쌉니다/);
  assert.match(verdict!.message, /싸졌어요/);
  assert.equal(verdict?.min.krwPerJpy, 8.4);
  assert.equal(verdict?.max.krwPerJpy, 8.8);
});

test('비싼 쪽에 있으면 비싼 편이라고 말한다', () => {
  const rising = fxVerdict([
    { date: '2026-10-01', krwPerJpy: 8.0 },
    { date: '2026-10-02', krwPerJpy: 8.2 },
    { date: '2026-10-03', krwPerJpy: 8.9 },
  ]);
  assert.equal(rising?.tone, 'bad');
  assert.match(rising!.message, /비싸졌어요/);
});

test('하루치만 있으면 판단하지 않는다', () => {
  assert.equal(fxVerdict([{ date: '2026-10-01', krwPerJpy: 8.4 }]), null);
});

test('발매·재입고·품절을 한 줄로 모아 최신순으로 준다', () => {
  const timeline = goodsTimeline(history, { id: 'a', releaseDate: '2026-09-01', restocks: ['2026-10-04'] });
  assert.deepEqual(timeline, [
    { date: '2026-10-05', kind: 'soldout' },
    { date: '2026-10-04', kind: 'restock' },
    { date: '2026-10-02', kind: 'soldout' },
    { date: '2026-09-01', kind: 'release' },
  ]);
});

test('공식 재입고일과 같은 날 본 재개는 한 번만 센다', () => {
  const timeline = goodsTimeline(history, { id: 'a', releaseDate: '2026-09-01', restocks: ['2026-10-04'] });
  assert.equal(timeline.filter((e) => e.date === '2026-10-04').length, 1);
});

test('다시 들어온 뒤 품절까지 걸린 날을 센다', () => {
  const timeline = goodsTimeline(history, { id: 'a', releaseDate: '2026-09-01', restocks: ['2026-10-04'] });
  assert.deepEqual(sellOutDays(timeline), [1]);
});

test('품절만 보이고 들어온 날을 못 본 구간은 세지 않는다', () => {
  assert.deepEqual(sellOutDays([{ date: '2026-10-02', kind: 'soldout' }]), []);
});

test('아무것도 안 바뀐 날은 변화 목록에서 뺀다', () => {
  const goods = (id: string) => ({ id, name: id, releaseDate: '2026-10-01' }) as GoodsSummary;
  const byId = new Map([['a', goods('a')], ['b', goods('b')]]);
  const changes = recentChanges(history, byId);
  assert.deepEqual(changes.map((c) => c.date), ['2026-10-05', '2026-10-04', '2026-10-02']);
  assert.deepEqual(changes[1].added.map((g) => g.id), ['b']);
});

test('목록에서 빠진 상품은 건너뛴다', () => {
  const changes = recentChanges(history, new Map());
  assert.deepEqual(changes, []);
});
