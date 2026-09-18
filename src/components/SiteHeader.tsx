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
          <img className="brand-mark" src="/images/chiikawa-face.png" alt="" width={32} height={28} />
          치이카와 파인더
        </Link>
        <MobileMenu pathname={pathname} />
      </header>

      <nav className="sidebar" aria-label="주요 메뉴">
        <Link href="/" className="brand sidebar-brand">
          <img className="brand-mark" src="/images/chiikawa-face.png" alt="" width={32} height={28} />
          <span className="brand-text">
            <span className="title-tag">먼가 작은</span>
            치이카와 파인더
          </span>
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
