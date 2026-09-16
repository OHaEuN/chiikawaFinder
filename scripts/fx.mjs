/**
 * 엔/원 환율을 받아 저장한다. 정적 사이트라 빌드 시점 값을 쓰고,
 * 매일 도는 크론이 이 값을 갱신한다. 계산기에서 사용자가 직접 고칠 수도 있다.
 */
import { writeFile } from 'node:fs/promises';

const API = 'https://open.er-api.com/v6/latest/JPY';
const OUT = new URL('../src/data/fx.json', import.meta.url);

const res = await fetch(API, { signal: AbortSignal.timeout(20000) });
if (!res.ok) throw new Error(`환율 API 실패: HTTP ${res.status}`);
const body = await res.json();
const krwPerJpy = body?.rates?.KRW;
if (typeof krwPerJpy !== 'number' || krwPerJpy <= 0) throw new Error('환율 응답에 KRW 가 없다');

await writeFile(OUT, JSON.stringify({ krwPerJpy, updatedAt: body.time_last_update_utc, source: API }, null, 2) + '\n');
console.log(`엔당 ${krwPerJpy.toFixed(2)}원 (${body.time_last_update_utc})`);
