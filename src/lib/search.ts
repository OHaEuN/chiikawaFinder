/**
 * 굿즈 이름은 공식몰에서 긁어 온 일본어 그대로라, "인형"이나 "키링"으로 찾으면 한 건도 안 나온다.
 *
 * 카테고리·브랜드는 한국어로 들어 있으니 이름과 함께 훑고,
 * 그래도 안 걸리는 말은 실제 상품명에 쓰인 일본어 표기로 바꿔 준다.
 * 표기는 goods.json 에 실제로 등장하는 것만 넣었다. 안 쓰이는 말을 넣으면 검색이 조용히 비는 걸 못 알아챈다.
 */
import { koreanName } from './goods-name.ts';

const ALIASES: Record<string, string[]> = {
  치이카와: ['ちいかわ'],
  하치와레: ['ハチワレ'],
  우사기: ['うさぎ', 'ウサギ'],
  모몽가: ['モモンガ'],
  랏코: ['ラッコ'],
  쿠리만쥬: ['くりまんじゅう', '栗まんじゅう'],
  밤만쥬: ['くりまんじゅう'],
  시사: ['シーサー'],
  갑옷: ['鎧'],
  아노코: ['あのこ'],
  헌책방: ['古本屋'],
  파자마: ['パジャマ'],
  인형: ['ぬいぐるみ'],
  마스코트: ['マスコット'],
  키링: ['キーホルダー'],
  키홀더: ['キーホルダー'],
  참: ['チャーム'],
  피규어: ['フィギュア'],
  아크릴: ['アクリル'],
  아크스: ['アクリルスタンド', 'アクスタ'],
  아크릴스탠드: ['アクリルスタンド'],
  스탠드: ['スタンド'],
  스티커: ['ステッカー', 'シール'],
  뱃지: ['バッジ'],
  배지: ['バッジ'],
  티셔츠: ['tシャツ'],
  후드: ['パーカー'],
  맨투맨: ['スウェット'],
  모자: ['キャップ', '帽子'],
  양말: ['靴下'],
  머리띠: ['カチューシャ'],
  가방: ['バッグ'],
  에코백: ['エコバッグ', 'トート'],
  토트: ['トート'],
  파우치: ['ポーチ'],
  지갑: ['財布'],
  머그: ['マグカップ'],
  컵: ['マグカップ', 'コップ'],
  마그넷: ['マグネット'],
  자석: ['マグネット'],
  수건: ['タオル'],
  타월: ['タオル'],
  손수건: ['ハンカチ'],
  담요: ['ブランケット'],
  쿠션: ['クッション'],
  볼펜: ['ボールペン'],
  노트: ['ノート'],
  메모: ['メモ'],
  필통: ['ペンケース'],
  파일: ['クリアファイル'],
  우산: ['傘'],
  접시: ['皿'],
  젓가락: ['箸'],
  도시락: ['弁当', 'ランチ'],
};

export interface Searchable {
  name: string;
  category?: string;
  brand?: string;
  collab?: string;
}

/** 붙여 쓰든 띄어 쓰든 같은 말로 본다. "아크릴스탠드" 와 "아크릴 스탠드" 는 같은 걸 찾는 말이다. */
const compact = (text: string) => text.toLowerCase().replace(/\s+/g, '');

export interface SearchEntry {
  /** 상품 이름만. 여기서 걸린 말은 분류·브랜드에서 걸린 것보다 찾던 물건에 가깝다. */
  name: string;
  /** 이름에 분류·브랜드·콜라보까지 더한 것 */
  text: string;
}

/**
 * 한 상품에서 검색어를 찾아볼 글자 뭉치. 목록이 길어 미리 한 번만 만들어 둔다.
 * 바꾼 한국어 이름과 일본어 원문을 모두 담는다. 원문으로 찾는 사람도 있다.
 */
export const searchEntry = (item: Searchable): SearchEntry => {
  const name = compact(`${item.name} ${koreanName(item.name)}`);
  return { name, text: name + compact([item.category, item.brand, item.collab].filter(Boolean).join(' ')) };
};

/**
 * 한 말에는 가장 긴 별칭 하나만 쓴다.
 * 「아크릴스탠드」 에 아크릴까지 같이 걸면 아크릴이 든 81건이 딸려 와, 길게 적은 쪽이 손해를 본다.
 */
const aliasesFor = (word: string) => {
  const key = Object.keys(ALIASES)
    .filter((korean) => word.includes(korean))
    .sort((a, b) => b.length - a.length)[0];
  return key ? ALIASES[key] : [];
};

/**
 * 띄어 쓴 말은 **모두** 들어맞아야 한다. 한 말이 한국어·일본어 어느 쪽으로 걸리든 그 말은 맞은 것으로 본다.
 * 하나만 걸려도 보여 주던 때는 「치이카와 인형」 이 치이카와가 든 2,294건을 전부 불러서,
 * 말을 덧붙일수록 결과가 넓어졌다. 좁히려고 친 말이 거꾸로 일했다.
 */
export const searchTerms = (query: string): string[][] =>
  query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...new Set([word, ...aliasesFor(word)].map(compact))]);

/**
 * 안 맞으면 -1, 맞으면 이름에서 걸린 말의 수가 점수다.
 * 「인형」 으로 찾을 때 분류만 인형인 마스코트보다 이름에 인형이 든 쪽이 먼저 나와야 한다.
 */
export function searchScore(entry: SearchEntry, groups: string[][]): number {
  let score = 0;
  for (const group of groups) {
    if (!group.some((term) => entry.text.includes(term))) return -1;
    if (group.some((term) => entry.name.includes(term))) score += 1;
  }
  return score;
}
