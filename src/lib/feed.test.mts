import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, entryTitle } from './feed.ts';
import type { DayChange } from './history.ts';

const goods = (id: string, name: string, price = '1,650엔') =>
  ({ id, name, brand: '치이카와 마켓', category: '잡화', releaseDate: '2026-11-01', price, country: 'JP' as const });

const day = (date: string, part: Partial<DayChange> = {}): DayChange => ({
  date,
  krwPerJpy: 8.5,
  added: [],
  soldOut: [],
  backInStock: [],
  ...part,
});

test('항목 제목에는 건수가 있는 묶음만 들어간다', () => {
  assert.equal(entryTitle(day('2026-11-11', { soldOut: [goods('cm-1', 'a')] })), '11월 11일 (수) · 품절 1');
  assert.equal(
    entryTitle(day('2026-11-10', { added: [goods('cm-1', 'a')], backInStock: [goods('cm-2', 'b'), goods('cm-3', 'c')] })),
    '11월 10일 (화) · 신상 1 · 재입고 2',
  );
});

test('하루가 한 항목이고 상품마다 상세 링크가 달린다', () => {
  const xml = buildFeed(
    [day('2026-11-11', { soldOut: [goods('cm-1', 'ぬいぐるみ')] }), day('2026-11-10', { added: [goods('cm-2', 'マスコット')] })],
    'https://example.test/',
  );
  assert.equal(xml.match(/<entry>/g)?.length, 2);
  assert.match(xml, /<updated>2026-11-11T06:00:00\+09:00<\/updated>/);
  assert.match(xml, /https:\/\/example\.test\/goods\/cm-1\//);
  assert.match(xml, /인형/);
});

test('이름의 꺾쇠와 앰퍼샌드는 피드를 깨뜨리지 않는다', () => {
  const xml = buildFeed([day('2026-11-11', { added: [goods('cm-1', 'A & B <C>')] })], 'https://example.test/');
  assert.doesNotMatch(xml, /A & B <C>/);
  assert.match(xml, /A &amp;amp; B &amp;lt;C&amp;gt;/);
});
