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
// 면세 한도가 미국 달러 기준이라 달러 환산도 같이 받아 둔다.
const usdPerJpy = body?.rates?.USD;
if (typeof krwPerJpy !== 'number' || krwPerJpy <= 0) throw new Error('환율 응답에 KRW 가 없다');
if (typeof usdPerJpy !== 'number' || usdPerJpy <= 0) throw new Error('환율 응답에 USD 가 없다');

await writeFile(OUT, JSON.stringify({ krwPerJpy, usdPerJpy, updatedAt: body.time_last_update_utc, source: API }, null, 2) + '\n');
console.log(`엔당 ${krwPerJpy.toFixed(2)}원 / 면세 한도 150달러 = ${Math.round(150 / usdPerJpy).toLocaleString()}엔`);
