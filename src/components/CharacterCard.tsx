import Link from 'next/link';
import type { Character } from '@/types/character';
import { SafeImage } from './SafeImage';
import { Tag } from './Tag';
import { GROUP_EMOJI } from '@/lib/labels';

interface CharacterCardProps { character: Character }

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link href={`/characters/${character.slug}`} className="card">
      <div className="card-media contain"><SafeImage src={character.image} alt={character.name} fallback={GROUP_EMOJI[character.group]} seed={character.slug} /></div>
      <div className="card-body">
        <div className="card-title">{character.name}</div>
        <div className="card-sub">{character.nameJa}</div>
        <div className="tags"><Tag tone="mint">{character.species}</Tag></div>
      </div>
    </Link>
  );
}
