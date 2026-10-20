import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesSearch, searchTerms, searchText } from './search.ts';

const nuigurumi = searchText({ name: 'ハチワレ ぬいぐるみ', category: '인형/마스코트', brand: '치이카와 마켓' });
const tshirt = searchText({ name: 'Tシャツ TRAINING（トリオ）ホワイト', category: '의류', brand: '치이카와 마켓' });

test('한국어로 찾아도 일본어 상품명이 걸린다', () => {
  assert.ok(matchesSearch(nuigurumi, searchTerms('인형')));
  assert.ok(matchesSearch(nuigurumi, searchTerms('하치와레')));
  assert.ok(matchesSearch(tshirt, searchTerms('티셔츠')));
});

test('대소문자가 달라도 걸린다', () => {
  assert.ok(matchesSearch(tshirt, searchTerms('TRAINING')));
});

test('일본어로 그대로 찾는 것도 된다', () => {
  assert.ok(matchesSearch(nuigurumi, searchTerms('ぬいぐるみ')));
});

test('상관없는 말은 걸리지 않는다', () => {
  assert.ok(!matchesSearch(tshirt, searchTerms('인형')));
  assert.ok(!matchesSearch(nuigurumi, searchTerms('우산')));
});

test('빈 검색어는 아무 말도 만들지 않는다', () => {
  assert.deepEqual(searchTerms('   '), []);
});
