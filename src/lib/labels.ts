import type { OnlineCategory } from '@/types/online';
import type { PlaceType } from '@/types/place';
import type { Character } from '@/types/character';
import type { GroupBuyChannel, GroupBuyStatus } from '@/types/groupbuy';

export const ONLINE_CATEGORY_LABEL: Record<OnlineCategory, string> = {
  manga: '만화',
  anime: '애니메이션',
  video: '영상',
  illustration: '일러스트',
  sns: 'SNS',
  game: '게임/앱',
  other: '기타',
};

export const PLACE_TYPE_LABEL: Record<PlaceType, string> = {
  popup: '팝업스토어',
  store: '상설 매장',
  cafe: '카페',
  restaurant: '레스토랑',
  event: '전시/이벤트',
  other: '기타',
};

export const COUNTRY_LABEL = { KR: '한국', JP: '일본', GLOBAL: '글로벌' } as const;

export const GROUP_ORDER = ['주인공', '주요 인물', '조연', '적/괴물', '기타'] as const;

export const PLACE_EMOJI: Record<PlaceType, string> = {
  popup: '🎪',
  store: '🏬',
  cafe: '☕',
  restaurant: '🍽️',
  event: '🎟️',
  other: '📍',
};

/** 카드에서 한 줄에 들어가도록 2026-10-02 → 26.10.02 */
export const shortDate = (iso: string) => iso.slice(2).replace(/-/g, '.');

/** 공식 이미지가 없는 인물에 쓰는 그룹별 아이콘 */
export const GROUP_EMOJI: Record<Character['group'], string> = {
  '주인공': '🐹',
  '주요 인물': '🐰',
  '조연': '🧸',
  '적/괴물': '👾',
  '기타': '✨',
};

export const GROUPBUY_STATUS_LABEL: Record<GroupBuyStatus, string> = {
  open: '모집 중',
  closed: '모집 마감',
  shipping: '배송 중',
  done: '종료',
};

export const GROUPBUY_CHANNEL_LABEL: Record<GroupBuyChannel, string> = {
  twitter: 'X(트위터)',
  cafe: '네이버 카페',
  openchat: '오픈채팅',
  instagram: '인스타그램',
  store: '스마트스토어',
  other: '기타',
};
