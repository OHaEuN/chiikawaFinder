import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CHARACTERS, characterName, findCharacter } from '@/lib/data';
import { SafeImage } from '@/components/SafeImage';
import { Tag } from '@/components/Tag';
import { GROUP_EMOJI } from '@/lib/labels';

interface PageProps { params: Promise<{ slug: string }> }

export const generateStaticParams = () => CHARACTERS.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const c = findCharacter((await params).slug);
  return { title: c ? c.name : '인물' };
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const c = findCharacter((await params).slug);
  if (!c) notFound();
  // 애니가 연속 넘버링이라 시즌이 하나뿐이면 그 열은 의미가 없다.
  const multiSeason = new Set(c.episodes.map((e) => e.season)).size > 1;
  return (
    <>
      <Link href="/characters" className="back">← 인물 목록</Link>
      <div className="detail-hero">
        <div className="card-media contain"><SafeImage src={c.image} alt={c.name} fallback={GROUP_EMOJI[c.group]} seed={c.slug} onWhite /></div>
        <div>
          <div className="tags" style={{ marginBottom: 8 }}><Tag tone="pink">{c.group}</Tag><Tag tone="mint">{c.species}</Tag></div>
          <h1>{c.name}</h1>
          <p className="muted">{c.nameJa} · {c.nameEn}</p>
          <p>{c.tagline}</p>
          <div className="tags">{c.traits.map((t) => <Tag key={t} tone="yellow">#{t}</Tag>)}</div>
          <dl className="kv" style={{ marginTop: 16 }}>
            {c.firstAppearance.manga && <><dt>만화 첫 등장</dt><dd>{c.firstAppearance.manga}</dd></>}
            {c.firstAppearance.anime && <><dt>애니 첫 등장</dt><dd>{c.firstAppearance.anime}</dd></>}
          </dl>
        </div>
      </div>

      <section className="panel">
        <h2>소개</h2>
        {c.description.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      {c.relationships.length > 0 && (
        <section className="panel">
          <h2>인간관계</h2>
          <dl className="kv">
            {c.relationships.map((r) => (
              <div key={r.slug} style={{ display: 'contents' }}>
                <dt><Link href={`/characters/${r.slug}`} style={{ textDecoration: 'underline' }}>{characterName(r.slug)}</Link></dt>
                <dd>{r.relation}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="panel">
        <h2>등장 에피소드 <span className="muted" style={{ fontSize: '0.9rem' }}>({c.episodes.length}화)</span></h2>
        {c.episodes.length === 0 ? <p className="muted">확인된 애니메이션 등장 에피소드가 없어요.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{multiSeason && <th>시즌</th>}<th>화</th><th>제목</th><th>비고</th></tr></thead>
              <tbody>
                {c.episodes.map((e) => (
                  <tr key={`${e.season}-${e.episode}`}>
                    {multiSeason && <td>{e.season}</td>}
                    <td className="num">{e.episode}</td>
                    <td>{e.title}</td>
                    <td className="muted">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {c.trivia.length > 0 && (
        <section className="panel">
          <h2>여담</h2>
          <ul>{c.trivia.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </section>
      )}

      <section className="panel">
        <h2>출처</h2>
        <ul>{c.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', textDecoration: 'underline' }}>{s}</a></li>)}</ul>
      </section>
    </>
  );
}
