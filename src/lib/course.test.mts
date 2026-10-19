import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourses, distanceKm } from './course.ts';
import type { Place } from '../types/place.ts';

const place = (id: string, city: string, lat: number, lng: number) =>
  ({ id, city, name: id, country: 'JP', lat, lng }) as Place;

test('도쿄역과 하라주쿠 사이 거리가 실제와 비슷하다', () => {
  const km = distanceKm({ lat: 35.6812, lng: 139.7671 }, { lat: 35.6702, lng: 139.7027 });
  assert.ok(km > 5.5 && km < 6.5, `${km}km`);
});

test('한 곳뿐인 도시는 코스로 만들지 않는다', () => {
  const courses = buildCourses([place('a', '도쿄', 35.68, 139.76), place('b', '사가', 33.26, 130.3)]);
  assert.deepEqual(courses.map((c) => c.city), []);
});

test('가운데서 시작해 가까운 곳부터 차례로 잇는다', () => {
  // 서→동으로 0.9km 씩 벌어진 네 곳. 가운데인 b 에서 시작한다.
  const courses = buildCourses([
    place('a', '도쿄', 35.68, 139.75),
    place('b', '도쿄', 35.68, 139.76),
    place('c', '도쿄', 35.68, 139.77),
    place('d', '도쿄', 35.68, 139.78),
  ]);
  assert.equal(courses.length, 1);
  assert.deepEqual(courses[0].stops.map((s) => s.place.id), ['b', 'a', 'c', 'd']);
  assert.equal(courses[0].stops[0].from, null);
});

test('가까우면 걷고 멀면 전철이라고 한다', () => {
  const courses = buildCourses([
    place('a', '도쿄', 35.68, 139.76),
    place('b', '도쿄', 35.681, 139.761),
    place('far', '도쿄', 35.75, 139.9),
  ]);
  const [, second, third] = courses[0].stops;
  assert.equal(second.from?.mode, 'walk');
  assert.ok(second.from!.minutes >= 1);
  assert.equal(third.from?.mode, 'transit');
  // 전철 구간은 노선을 모르니 시간을 지어내지 않는다.
  assert.equal(third.from?.minutes, 0);
});

test('장소가 많은 도시부터 보여 준다', () => {
  const courses = buildCourses([
    place('o1', '오사카', 34.7, 135.5),
    place('o2', '오사카', 34.71, 135.51),
    place('t1', '도쿄', 35.68, 139.76),
    place('t2', '도쿄', 35.69, 139.77),
    place('t3', '도쿄', 35.7, 139.78),
  ]);
  assert.deepEqual(courses.map((c) => c.city), ['도쿄', '오사카']);
  assert.equal(courses[0].movingMinutes, courses[0].stops.reduce((s, x) => s + (x.from?.minutes ?? 0), 0));
});
