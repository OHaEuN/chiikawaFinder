'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { CursorPicker } from './CursorPicker';
import { MobileMenu } from './MobileMenu';
import { NAV_ITEMS, isActivePath } from './nav';

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          치이카와 파인더
        </Link>
        <MobileMenu pathname={pathname} />
      </header>

      <nav className="sidebar" aria-label="주요 메뉴">
        <Link href="/" className="brand sidebar-brand">
          <span className="brand-mark" />
          치이카와 파인더
        </Link>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}>
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <CursorPicker />
      </nav>
    </>
  );
}
