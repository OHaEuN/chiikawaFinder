/**
 * 지난 기록을 git 에서 되살린다.
 *
 * 매일 도는 크론이 굿즈와 환율을 한 커밋에 담아 왔다. 그 커밋들을 날짜순으로 펴면
 * 기록을 시작한 날부터의 품절·재입고·환율이 그대로 나온다. 한 번만 돌리면 되고,
 * 그 뒤로는 scrape.mjs 가 하루치씩 덧붙인다.
 */
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { appendDay, diffDay, emptyHistory } from './history.mjs';

const OUT = new URL('../src/data/history.json', import.meta.url);
const GOODS = 'src/data/goods.json';
const FX = 'src/data/fx.json';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 30 });

const showJson = (sha, path) => {
  try {
    return JSON.parse(git('show', `${sha}:${path}`));
  } catch {
    return null;
  }
};

/** 하루에 두 번 커밋된 날이 있다. 그날의 마지막 상태만 남긴다. */
const commitsByDate = () => {
  const byDate = new Map();
  const lines = git('log', '--reverse', '--format=%H %ad', '--date=short', '--', GOODS).trim().split('\n');
  for (const line of lines) {
    const [sha, date] = line.split(' ');
    byDate.set(date, sha);
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
};

let history = emptyHistory();
let previous = [];
let started = false;
let first = true;

for (const [date, sha] of commitsByDate()) {
  const goods = showJson(sha, GOODS);
  if (!goods) continue;
  // 재고를 모으기 전 커밋은 품절 여부가 없어 비교해도 의미가 없다.
  if (!started && !goods.some((g) => typeof g.available === 'boolean')) continue;
  if (!started) {
    started = true;
    previous = goods;
    continue;
  }
  const krwPerJpy = showJson(sha, FX)?.krwPerJpy ?? 0;
  const day = diffDay({ date, previous, current: goods, krwPerJpy });
  // 비교 첫날에 늘어난 상품은 새로 나온 건지 그날부터 긁기 시작한 건지 알 수 없다.
  history = appendDay(history, first ? { ...day, added: [] } : day);
  first = false;
  previous = goods;
}

await writeFile(OUT, JSON.stringify(history, null, 2) + '\n');
const totals = history.days.reduce(
  (acc, d) => ({ added: acc.added + d.added.length, soldOut: acc.soldOut + d.soldOut.length, back: acc.back + d.backInStock.length }),
  { added: 0, soldOut: 0, back: 0 },
);
console.log(`${history.days.length}일치 기록 · 신상 ${totals.added} · 품절 ${totals.soldOut} · 재입고 ${totals.back}`);
