import type { Place } from '@/types/place';

/**
 * 도시별 토벌 코스.
 *
 * 매장 목록만 주면 "그래서 하루에 어디부터 돌지"가 안 나온다. 지도에서 직접 재 보는 수밖에 없는데,
 * 좌표는 이미 가지고 있으니 가까운 데부터 이어 붙이면 된다. 최적 경로를 푸는 게 아니라
 * 들를 만한 순서를 정해 주는 정도다.
 */

/** 코스로 묶을 최소 개수. 한 곳뿐이면 코스가 아니다. */
const MIN_STOPS = 2;
/** 보통 걸음. 짐 들고 굿즈 보며 걷는 속도로 잡는다. */
const WALK_KMH = 4.2;
/** 이보다 멀면 걷지 말고 전철을 타라고 알린다. */
const WALK_LIMIT_KM = 1.8;

const EARTH_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: Pick<Place, 'lat' | 'lng'>, b: Pick<Place, 'lat' | 'lng'>): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

export interface CourseStop {
  place: Place;
  /** 앞 장소에서 여기까지. 첫 장소는 없다. */
  from: { km: number; minutes: number; mode: 'walk' | 'transit' } | null;
}

export interface Course {
  city: string;
  country: Place['country'];
  stops: CourseStop[];
  /** 전부 도는 데 걸리는 이동 시간(분). 매장에 머무는 시간은 빼고 센다. */
  movingMinutes: number;
}

const leg = (km: number): CourseStop['from'] =>
  km <= WALK_LIMIT_KM
    ? { km, minutes: Math.max(1, Math.round((km / WALK_KMH) * 60)), mode: 'walk' }
    : // 전철은 노선을 모르니 시간을 지어내지 않는다. 거리만 알린다.
      { km, minutes: 0, mode: 'transit' };

/**
 * 도시 한가운데에서 제일 가까운 곳부터 시작해, 그다음은 늘 가장 가까운 곳으로 간다.
 * 가장 짧은 길을 보장하지는 않지만 뒤로 되돌아가는 동선은 거의 사라진다.
 */
function order(places: Place[]): CourseStop[] {
  const centerLat = places.reduce((sum, p) => sum + p.lat, 0) / places.length;
  const centerLng = places.reduce((sum, p) => sum + p.lng, 0) / places.length;
  const center = { lat: centerLat, lng: centerLng };

  const rest = [...places];
  let current = rest.reduce((best, p) => (distanceKm(p, center) < distanceKm(best, center) ? p : best));
  rest.splice(rest.indexOf(current), 1);

  const stops: CourseStop[] = [{ place: current, from: null }];
  while (rest.length > 0) {
    const here = current;
    const next = rest.reduce((best, p) => (distanceKm(p, here) < distanceKm(best, here) ? p : best));
    rest.splice(rest.indexOf(next), 1);
    stops.push({ place: next, from: leg(distanceKm(here, next)) });
    current = next;
  }
  return stops;
}

/** 한 도시에 두 곳 넘게 열려 있을 때만 코스로 묶는다. 많이 모인 도시부터. */
export function buildCourses(places: Place[]): Course[] {
  const byCity = new Map<string, Place[]>();
  for (const place of places) {
    const bucket = byCity.get(place.city);
    if (bucket) bucket.push(place);
    else byCity.set(place.city, [place]);
  }

  return [...byCity.entries()]
    .filter(([, group]) => group.length >= MIN_STOPS)
    .map(([city, group]) => {
      const stops = order(group);
      return {
        city,
        country: group[0].country,
        stops,
        movingMinutes: stops.reduce((sum, s) => sum + (s.from?.minutes ?? 0), 0),
      };
    })
    .sort((a, b) => b.stops.length - a.stops.length || a.city.localeCompare(b.city));
}
