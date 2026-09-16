import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dDayLabel, koreanDate, upcomingReleases } from './calendar.ts';
import type { GoodsSummary } from '../types/goods.ts';

const goods = [
  { id: 'a', releaseDate: '2026-09-10' },
  { id: 'b', releaseDate: '2026-09-18' },
  { id: 'c', releaseDate: '2026-09-18' },
  { id: 'd', releaseDate: '2026-10-02' },
  { id: 'e', releaseDate: '2026-09-16' },
] as GoodsSummary[];

test('지난 발매는 빼고 날짜별로 묶어 정렬한다', () => {
  const days = upcomingReleases(goods, '2026-09-16');
  assert.deepEqual(days.map((d) => d.date), ['2026-09-16', '2026-09-18', '2026-10-02']);
  assert.equal(days[1].items.length, 2);
});

test('남은 날짜를 센다', () => {
  const days = upcomingReleases(goods, '2026-09-16');
  assert.deepEqual(days.map((d) => d.daysAway), [0, 2, 16]);
});

test('D-day 표기', () => {
  assert.equal(dDayLabel(0), '오늘');
  assert.equal(dDayLabel(7), 'D-7');
});

test('요일까지 한국어로 적는다', () => {
  assert.equal(koreanDate('2026-09-18'), '9월 18일 (금)');
});

test('앞으로 나올 게 없으면 빈 배열', () => {
  assert.deepEqual(upcomingReleases(goods, '2027-01-01'), []);
});
