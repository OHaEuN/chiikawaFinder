import type { Metadata } from 'next';
import { CHARACTERS } from '@/lib/data';
import { GROUP_ORDER } from '@/lib/labels';
import { CharacterCard } from '@/components/CharacterCard';

export const metadata: Metadata = {
  title: '인물 · 세계관',
  description:
    '치이카와에 나오는 인물 45명을 원작과 애니 기준으로 정리했습니다. 종족과 소속, 처음 나온 화, 작중에서 한 일까지 출처를 달아 적었습니다.',
};

export default function CharactersPage() {
  return (
    <>
      <div className="page-head">
        <h1>인물 · 세계관</h1>
        <p>치이카와에 나오는 인물 전원의 프로필과 등장 에피소드를 정리했습니다.</p>
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
