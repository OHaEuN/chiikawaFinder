import type { Metadata } from 'next';
import Link from 'next/link';
import { PLACES, isOngoing } from '@/lib/data';
import { buildCourses, type Course } from '@/lib/course';
import { COUNTRY_LABEL, PLACE_EMOJI, PLACE_TYPE_LABEL } from '@/lib/labels';
import { Tag } from '@/components/Tag';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: '토벌 코스',
  description:
    '치이카와 랜드와 콜라보 카페를 도시별로 묶어 가까운 순서대로 이었습니다. 도쿄·오사카·서울에서 하루에 어디부터 돌면 되는지, 구간마다 걸어갈지 전철을 탈지까지.',
};

/** 구글 지도 길찾기 주소가 받아 주는 경유지 수. 넘으면 링크가 안 열린다. */
const MAX_ROUTE_STOPS = 10;

const coord = (place: { lat: number; lng: number }) => `${place.lat},${place.lng}`;

/** 코스 전체를 구글 지도 길찾기로 넘긴다. 자리가 모자라면 앞쪽만 넣는다. */
function directionsUrl(course: Course): string {
  const stops = course.stops.slice(0, MAX_ROUTE_STOPS).map((s) => s.place);
  const waypoints = stops.slice(1, -1).map(coord).join('|');
  const params = new URLSearchParams({
    api: '1',
    origin: coord(stops[0]),
    destination: coord(stops[stops.length - 1]),
    travelmode: 'walking',
  });
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params}`;
}

function CourseSection({ course }: { course: Course }) {
  const capped = course.stops.length > MAX_ROUTE_STOPS;
  return (
    <section className="panel course">
      <div className="course-head">
        <h2>
          {course.city}
          <Tag tone={course.country === 'KR' ? 'pink' : 'blue'}>{COUNTRY_LABEL[course.country]}</Tag>
        </h2>
        <span className="muted">
          {course.stops.length}곳
          {course.movingMinutes > 0 ? ` · 걷는 시간 약 ${course.movingMinutes}분` : ''}
        </span>
      </div>

      <ol className="course-stops">
        {course.stops.map((stop, index) => (
          <li key={stop.place.id}>
            {stop.from && (
              <div className="course-leg muted">
                {stop.from.mode === 'walk'
                  ? `도보 ${stop.from.minutes}분 (${stop.from.km.toFixed(1)}km)`
                  : `${stop.from.km.toFixed(1)}km · 전철로 이동`}
              </div>
            )}
            <Link href={`/offline/${stop.place.id}`} className="course-stop">
              <span className="course-no">{index + 1}</span>
              <span className="course-body">
                <span className="card-title">
                  <span className="course-emoji" aria-hidden>{PLACE_EMOJI[stop.place.type]}</span>
                  {stop.place.name}
                </span>
                <span className="card-sub">
                  {PLACE_TYPE_LABEL[stop.place.type]}
                  {stop.place.hours ? ` · ${stop.place.hours}` : ''}
                </span>
                <span className="card-sub">{stop.place.sells.slice(0, 3).join(' · ')}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <TrackedLink className="btn soft" href={directionsUrl(course)} event="course_directions" props={{ city: course.city }}>
        구글 지도로 길찾기 ↗
      </TrackedLink>
      {capped && <p className="muted course-note">길찾기 주소에는 앞 {MAX_ROUTE_STOPS}곳까지만 들어갑니다.</p>}
    </section>
  );
}

export default function CoursePage() {
  // 끝난 팝업을 코스에 넣으면 헛걸음한다. 지금 열려 있는 곳만 묶는다.
  const courses = buildCourses(PLACES.filter((p) => isOngoing(p)));
  const total = courses.reduce((sum, c) => sum + c.stops.length, 0);

  return (
    <>
      <div className="page-head">
        <h1>토벌 코스</h1>
        <p>
          지금 열려 있는 매장과 팝업 {total}곳을 도시별로 묶고, 도시 한가운데에서 가까운 순서대로 이었습니다.
          구간마다 걸어갈지 전철을 탈지도 적어 뒀습니다.
        </p>
      </div>

      {courses.map((course) => (
        <CourseSection key={course.city} course={course} />
      ))}

      <div className="notice">
        가장 짧은 길을 보장하지는 않습니다. 좌표만 보고 가까운 곳부터 이은 것이라, 실제로는 전철 노선에 따라 순서를
        바꾸는 게 빠를 수 있습니다. 치이카와 랜드는 신상 발매일에 입장 정리권제로 운영되는 날이 있으니 가기 전에 각
        매장 페이지의 공식 링크를 확인하세요. 한 곳만 있는 도시는 <Link href="/offline">오프라인 지도</Link>에서 볼 수
        있습니다.
      </div>
    </>
  );
}
