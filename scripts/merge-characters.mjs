/**
 * 인물 데이터 병합.
 * 리서치를 두 번 돌리면서 한쪽은 에피소드 목록을, 다른 쪽은 이미지와 인물 수를 더 많이 확보했다.
 * 새 파일을 기준으로 삼고 옛 파일의 에피소드를 slug 별로 옮겨 붙인다.
 * 옛 파일에만 있는 인물은 그대로 살린다.
 */
import { readFile, writeFile } from 'node:fs/promises';

const [, , oldPath, newPath, outPath] = process.argv;

/** 두 리서치가 같은 인물에 다른 slug를 붙인 경우 */
const ALIAS = {
  'pochette-no-yoroi': 'yoroi-san',
  'roudou-no-yoroi': 'roudou-no-yoroi-san',
  'ramen-no-yoroi': 'ramen-no-yoroi-san',
  'erai-yoroi': 'erai-yoroi-san',
  'dekatsuyo': 'dekaitsuyo',
  'kimera': 'chimera',
  'kuroi-nagareboshi': 'kuroi-hoshi',
  'mitsuboshi': 'hoshi',
  'muchauman': 'muchau-man',
  'gray-kids': 'gray-no-ko',
};

const canonical = (slug) => ALIAS[slug] ?? slug;

const oldChars = JSON.parse(await readFile(oldPath, 'utf8'));
const newChars = JSON.parse(await readFile(newPath, 'utf8'));

const oldBySlug = new Map(oldChars.map((c) => [canonical(c.slug), c]));
const merged = newChars.map((c) => {
  const prev = oldBySlug.get(c.slug);
  if (!prev) return c;
  oldBySlug.delete(c.slug);
  return {
    ...c,
    episodes: c.episodes.length ? c.episodes : prev.episodes,
    trivia: c.trivia.length >= prev.trivia.length ? c.trivia : prev.trivia,
    sources: [...new Set([...c.sources, ...prev.sources])],
  };
});

// 새 파일에 없는 옛 인물은 slug를 정규화해서 살린다.
const known = new Set(merged.map((c) => c.slug));
for (const prev of oldBySlug.values()) {
  merged.push({ ...prev, slug: canonical(prev.slug) });
  known.add(canonical(prev.slug));
}

// 관계 링크가 없는 인물을 가리키면 상세 페이지가 깨진다. 정규화 후 걸러 낸다.
for (const c of merged) {
  c.relationships = c.relationships
    .map((r) => ({ ...r, slug: canonical(r.slug) }))
    .filter((r) => known.has(r.slug) && r.slug !== c.slug);
}

const GROUP_ORDER = ['주인공', '주요 인물', '조연', '적/괴물', '기타'];
merged.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));

await writeFile(outPath, JSON.stringify(merged, null, 2) + '\n');
console.log(
  `${merged.length}명, 에피소드 ${merged.reduce((n, c) => n + c.episodes.length, 0)}건, 이미지 ${merged.filter((c) => c.image).length}장`,
);
