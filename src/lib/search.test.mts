import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchEntry, searchScore, searchTerms } from './search.ts';

const nuigurumi = searchEntry({ name: 'ハチワレ ぬいぐるみ', category: '인형/마스코트', brand: '치이카와 마켓' });
const tshirt = searchEntry({ name: 'Tシャツ TRAINING（トリオ）ホワイト', category: '의류', brand: '치이카와 마켓' });
const acrylic = searchEntry({ name: 'ちいかわランド レイヤーアクリルスタンド', category: '잡화', brand: '치이카와 마켓' });

const hits = (entry: ReturnType<typeof searchEntry>, query: string) => searchScore(entry, searchTerms(query)) >= 0;

test('한국어로 찾아도 일본어 상품명이 걸린다', () => {
  assert.ok(hits(nuigurumi, '인형'));
  assert.ok(hits(nuigurumi, '하치와레'));
  assert.ok(hits(tshirt, '티셔츠'));
});

test('대소문자가 달라도 걸린다', () => {
  assert.ok(hits(tshirt, 'TRAINING'));
});

test('일본어로 그대로 찾는 것도 된다', () => {
  assert.ok(hits(nuigurumi, 'ぬいぐるみ'));
});

test('상관없는 말은 걸리지 않는다', () => {
  assert.ok(!hits(tshirt, '인형'));
  assert.ok(!hits(nuigurumi, '우산'));
});

test('빈 검색어는 아무 말도 만들지 않는다', () => {
  assert.deepEqual(searchTerms('   '), []);
});

test('띄어 쓴 말은 모두 맞아야 한다', () => {
  assert.ok(hits(nuigurumi, '하치와레 인형'));
  // 하치와레는 맞지만 티셔츠가 아니다. 하나만 맞아도 보여 주면 좁힌 게 아니다.
  assert.ok(!hits(nuigurumi, '하치와레 티셔츠'));
});

test('맞은 말이 많을수록 점수가 높다', () => {
  const one = searchScore(nuigurumi, searchTerms('인형'));
  const two = searchScore(nuigurumi, searchTerms('하치와레 인형'));
  assert.equal(one, 1);
  assert.equal(two, 2);
});

test('이름이 아니라 분류에만 걸리면 점수가 낮다', () => {
  const mascot = searchEntry({ name: 'ちいかわ マスコット', category: '인형/마스코트', brand: '치이카와 마켓' });
  assert.equal(searchScore(mascot, searchTerms('인형')), 0);
  assert.ok(searchScore(nuigurumi, searchTerms('인형')) > searchScore(mascot, searchTerms('인형')));
});

test('붙여 써도 띄어 써도 같은 걸 찾는다', () => {
  assert.ok(hits(acrylic, '아크릴스탠드'));
  assert.ok(hits(acrylic, '아크릴 스탠드'));
});

test('별칭은 가장 긴 말 하나만 쓴다', () => {
  // 아크릴스탠드가 아크릴까지 끌고 오면 아크릴 클립도 같이 걸린다.
  const clip = searchEntry({ name: 'アクリルクリップ（くりまんじゅう）', category: '잡화', brand: '치이카와 마켓' });
  assert.ok(hits(clip, '아크릴'));
  assert.ok(!hits(clip, '아크릴스탠드'));
});
