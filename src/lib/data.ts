import characters from '@/data/characters.json';
import online from '@/data/online.json';
import places from '@/data/places.json';
import goods from '@/data/goods.json';
import groupbuyChannels from '@/data/groupbuy-channels.json';
import fx from '@/data/fx.json';
import type { Character } from '@/types/character';
import type { OnlineContent } from '@/types/online';
import type { Place } from '@/types/place';
import type { Goods, GoodsSummary } from '@/types/goods';
import type { GroupBuyChannel } from '@/types/groupbuy';

export const CHARACTERS = characters as Character[];
export const ONLINE = online as OnlineContent[];
export const PLACES = places as Place[];
export const GOODS = [...(goods as Goods[])].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

export const goodsSummaries = (list: Goods[] = GOODS): GoodsSummary[] =>
  list.map(({ id, name, brand, collab, category, releaseDate, price, image, country, available, restockCount }) => ({
    id, name, brand, collab, category, releaseDate, price, image, country, available, restockCount,
  }));

export const GROUPBUY_CHANNELS = groupbuyChannels as GroupBuyChannel[];

export const FX = fx as { krwPerJpy: number; usdPerJpy: number; updatedAt: string; source: string };

/** 엔화 표기 굿즈만 계산기 후보로 쓴다. "1,650엔" → 1650 */
export const yenPrice = (price: string): number | null => {
  const match = /^([\d,]+)엔$/.exec(price.trim());
  return match ? Number(match[1].replace(/,/g, '')) : null;
};

export const findCharacter = (slug: string) => CHARACTERS.find((c) => c.slug === slug);
export const findPlace = (id: string) => PLACES.find((p) => p.id === id);
export const findGoods = (id: string) => GOODS.find((g) => g.id === id);

export const characterName = (slug: string) => findCharacter(slug)?.name ?? slug;

export const isOngoing = (place: Place, today = new Date().toISOString().slice(0, 10)) =>
  !place.period || !place.period.end || place.period.end >= today;
