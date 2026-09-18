'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CursorPicker } from './CursorPicker';
import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';

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
          치이카와 파인더
        </Link>
        <NavLinks pathname={pathname} />
        <CursorPicker />
      </nav>
    </>
  );
}
