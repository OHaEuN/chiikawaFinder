import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: '3rem' }}>🥲</div>
      <h1>페이지를 찾을 수 없어요</h1>
      <Link href="/" className="btn soft">홈으로</Link>
    </div>
  );
}
