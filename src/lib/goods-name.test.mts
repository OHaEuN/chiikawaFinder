import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasJapanese, koreanName } from './goods-name.ts';

test('상품 종류가 한국어로 읽힌다', () => {
  assert.equal(koreanName('ちいかわパーク フラッグ ヘアバンド（イエロー）'), '치이카와 파크 플래그 헤어밴드 (옐로)');
  assert.equal(koreanName('映画ちいかわ 水面アクリルキーホルダー（シーサー）'), '영화 치이카와 수면 아크릴 키홀더 (시사)');
});

test('긴 조각이 짧은 조각보다 먼저 걸린다', () => {
  // 大きめ 를 大 + きめ 로 잘라 읽으면 뜻이 달라진다
  assert.ok(koreanName('大きめステッカー').startsWith('큰 스티커'));
  assert.equal(koreanName('キーリングコスメパレット'), '키링 코스메 팔레트');
});

test('받침에 따라 와/과를 가른다', () => {
  assert.equal(koreanName('ちいかわと自転車'), '치이카와와 자전거');
  assert.equal(koreanName('ハチワレと自転車'), '하치와레와 자전거');
  assert.equal(koreanName('くりまんじゅうと自転車'), '쿠리만쥬와 자전거');
  assert.equal(koreanName('古本屋と自転車'), '헌책방과 자전거');
});

test('숫자가 섞인 꼴도 바뀐다', () => {
  assert.equal(koreanName('全8種'), '전 8종');
  assert.equal(koreanName('2コセット'), '2개 세트');
  assert.equal(koreanName('2026年11月下旬より順次発送予定'), '2026년 11월 하순부터 순차 발송 예정');
});

test('괄호와 가운뎃점을 한국어 표기로 정리한다', () => {
  assert.equal(koreanName('折りたたみクリアトレー（ハチワレ・ラッコ）'), '접이식 클리어 트레이 (하치와레 · 랏코)');
  assert.equal(koreanName('大きめステッカー（守ろうッ・・・）'), '큰 스티커 (守ろうッ…)');
});

test('이미 한국어인 이름은 건드리지 않는다', () => {
  const name = '치이카와 스시 마스코트 · 시사(새우)';
  assert.equal(koreanName(name), name);
});

test('바꿀 조각이 없으면 원문을 돌려준다', () => {
  assert.equal(koreanName('ONIGIRI UMA'), 'ONIGIRI UMA');
});

test('일본어가 남았는지 가려낸다', () => {
  assert.equal(hasJapanese('접이식 클리어 트레이'), false);
  assert.equal(hasJapanese('앞치마 (どらやきおいしい)'), true);
});

test('짧은 조각이 긴 낱말을 잘라먹지 않는다', () => {
  // 「水」 한 글자를 사전에 넣었더니 水色이 「물 色」 이 됐다. 낱말째로 넣어야 한다.
  assert.equal(koreanName('ミニネコハウスポーチ（水色）'), '미니 ネコハウス 파우치 (하늘색)');
  assert.equal(koreanName('ちいかわ寿司 撥水湯呑み'), '치이카와 스시 발수 찻잔 み');
  // 「ドライ」 가 ドライブ·マイルドライナー 를 반 토막 내던 것
  assert.equal(koreanName('Tシャツ サマードライブ オフホワイト'), '티셔츠 サマー 드라이브 오프 화이트');
  assert.ok(!koreanName('マイルドライナー（マイルドソーダブルー）').includes('드라이 '));
});

test('수량 단위를 한국어로 센다', () => {
  assert.equal(koreanName('3枚セットタオル'), '3장 세트 타월');
  assert.equal(koreanName('おばけな3連蓄光アクリルチャーム'), '유령 3연 야광 아크릴 참');
});

test('보강한 생활용품 이름이 한국어로 나온다', () => {
  assert.equal(koreanName('お年玉袋'), '세뱃돈 봉투');
  assert.equal(koreanName('おしゃべりちいかわ専用パジャマ'), '말하는 치이카와 전용 파자마');
  assert.equal(koreanName('レディースコンビネゾン（ちいかわ）'), '여성용 콤비네종 (치이카와)');
});
