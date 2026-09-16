/**
 * 장소·인물 이미지를 public/images 아래로 내려받고 JSON을 로컬 경로로 바꾼다.
 * 외부 핫링크는 hotlink 차단이나 CDN 만료로 조용히 깨진다. 굿즈(수천 건)는
 * Shopify CDN을 그대로 쓰고, 건수가 적은 이 둘만 파일로 고정한다.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TARGETS = [
  { json: 'src/data/places.json', dir: 'places', key: 'id' },
  { json: 'src/data/characters.json', dir: 'characters', key: 'slug' },
];
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
const TIMEOUT_MS = 20000;

const isLocal = (src) => !src || src.startsWith('/');

async function download(src, dir, name) {
  const res = await fetch(src, {
    headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  const ext = EXT[type];
  if (!ext) throw new Error(`형식 아님: ${type || '없음'}`);
  const body = Buffer.from(await res.arrayBuffer());
  // 같은 이미지를 여러 항목이 공유하는 경우가 있어 내용 해시를 파일명에 붙인다.
  const file = `${name}-${createHash('sha1').update(body).digest('hex').slice(0, 8)}${ext}`;
  await writeFile(path.join(ROOT, 'public/images', dir, file), body);
  return `/images/${dir}/${file}`;
}

let ok = 0;
let failed = 0;
for (const { json, dir, key } of TARGETS) {
  const file = path.join(ROOT, json);
  const items = JSON.parse(await readFile(file, 'utf8'));
  await mkdir(path.join(ROOT, 'public/images', dir), { recursive: true });
  for (const item of items) {
    if (isLocal(item.image)) continue;
    try {
      item.image = await download(item.image, dir, item[key]);
      ok++;
    } catch (error) {
      console.warn(`✗ ${item[key]}: ${error.message}`);
      item.image = '';
      failed++;
    }
  }
  await writeFile(file, JSON.stringify(items, null, 2) + '\n');
}
console.log(`내려받음 ${ok}건, 실패 ${failed}건`);
