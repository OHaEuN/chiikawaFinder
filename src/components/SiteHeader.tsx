'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/characters', label: '인물', icon: 'character' },
  { href: '/online', label: '온라인', icon: 'online' },
  { href: '/offline', label: '오프라인', icon: 'offline' },
  { href: '/goods', label: '굿즈', icon: 'goods' },
  { href: '/groupbuy', label: '공구', icon: 'groupbuy' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          치이카와 파인더
        </Link>
      </header>

      <nav className="sidebar" aria-label="주요 메뉴">
        <Link href="/" className="brand sidebar-brand">
          <span className="brand-mark" />
          치이카와 파인더
        </Link>
        <ul>
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
                <Icon name={n.icon} />
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="tabbar" aria-label="주요 메뉴">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
            <Icon name={n.icon} size={23} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
