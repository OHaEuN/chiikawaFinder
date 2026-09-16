import type { Metadata } from 'next';
import { CHARACTERS } from '@/lib/data';
import { GROUP_ORDER } from '@/lib/labels';
import { CharacterCard } from '@/components/CharacterCard';

export const metadata: Metadata = { title: '인물 · 세계관' };

export default function CharactersPage() {
  return (
    <>
      <div className="page-head">
        <h1>인물 · 세계관</h1>
        <p>치이카와 세계에 등장하는 모든 인물의 프로필과 등장 에피소드를 모았어요.</p>
      </div>
      {GROUP_ORDER.map((group) => {
        const list = CHARACTERS.filter((c) => c.group === group);
        if (list.length === 0) return null;
        return (
          <section key={group}>
            <h2 style={{ marginTop: 24 }}>{group}</h2>
            <div className="grid">{list.map((c) => <CharacterCard key={c.slug} character={c} />)}</div>
          </section>
        );
      })}
    </>
  );
}
