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
  머그: ['マグ'],
  컵: ['マグ', 'コップ'],
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

/**
 * 한 상품에서 검색어를 찾아볼 글자 뭉치. 목록이 길어 미리 한 번만 만들어 둔다.
 * 바꾼 한국어 이름과 일본어 원문을 모두 담는다. 원문으로 찾는 사람도 있다.
 */
export const searchText = (item: Searchable) =>
  [item.name, koreanName(item.name), item.category, item.brand, item.collab]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/** 검색어 하나가 한국어·일본어 여러 갈래로 퍼진다. 하나라도 걸리면 맞는 것으로 본다. */
export const searchTerms = (query: string): string[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const aliases = Object.entries(ALIASES).flatMap(([korean, japanese]) => (q.includes(korean) ? japanese : []));
  return [q, ...aliases.map((term) => term.toLowerCase())];
};

export const matchesSearch = (text: string, terms: string[]) => terms.some((term) => text.includes(term));
