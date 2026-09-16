import characters from '@/data/characters.json';
import online from '@/data/online.json';
import places from '@/data/places.json';
import goods from '@/data/goods.json';
import groupbuy from '@/data/groupbuy.json';
import type { Character } from '@/types/character';
import type { OnlineContent } from '@/types/online';
import type { Place } from '@/types/place';
import type { Goods, GoodsSummary } from '@/types/goods';
import type { GroupBuy } from '@/types/groupbuy';

export const CHARACTERS = characters as Character[];
export const ONLINE = online as OnlineContent[];
export const PLACES = places as Place[];
export const GOODS = [...(goods as Goods[])].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

export const goodsSummaries = (list: Goods[] = GOODS): GoodsSummary[] =>
  list.map(({ id, name, brand, collab, category, releaseDate, price, image, country }) => ({
    id, name, brand, collab, category, releaseDate, price, image, country,
  }));

const STATUS_ORDER: Record<GroupBuy['status'], number> = { open: 0, shipping: 1, closed: 2, done: 3 };

export const GROUP_BUYS = [...(groupbuy as GroupBuy[])].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.deadline ?? '').localeCompare(b.deadline ?? ''),
);

export const findCharacter = (slug: string) => CHARACTERS.find((c) => c.slug === slug);
export const findPlace = (id: string) => PLACES.find((p) => p.id === id);
export const findGoods = (id: string) => GOODS.find((g) => g.id === id);

export const characterName = (slug: string) => findCharacter(slug)?.name ?? slug;

export const isOngoing = (place: Place, today = new Date().toISOString().slice(0, 10)) =>
  !place.period || !place.period.end || place.period.end >= today;
