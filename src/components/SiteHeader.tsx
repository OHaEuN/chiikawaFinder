'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '홈', emoji: '🏠' },
  { href: '/characters', label: '인물', emoji: '🐹' },
  { href: '/online', label: '온라인', emoji: '📺' },
  { href: '/offline', label: '오프라인', emoji: '📍' },
  { href: '/goods', label: '굿즈', emoji: '🎁' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand"><span className="brand-dot">🌸</span>치이카와 파인더</Link>
          <nav className="nav">
            {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>{n.label}</Link>)}
          </nav>
        </div>
      </header>
      <nav className="tabbar">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
            <span>{n.emoji}</span><span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
