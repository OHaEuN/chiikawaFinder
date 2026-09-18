'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { NAV_ITEMS, isActivePath } from './nav';

interface MobileMenuProps {
  pathname: string;
}

/**
 * 모바일 메뉴. 항목이 일곱 개라 하단 탭에 늘어놓으면 글씨가 뭉개진다.
 * 커서 고르기는 손가락으로 쓰는 화면에서 의미가 없어 데스크톱 사이드바에만 둔다.
 *
 * <dialog> 를 showModal 로 열면 Esc 닫기, 배경 포커스 차단, 스크롤 잠금을
 * 브라우저가 맡아 준다. 직접 만든 서랍으로는 그만큼을 다시 짜야 한다.
 */
export function MobileMenu({ pathname }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 페이지를 옮기면 닫는다. 링크마다 닫기를 붙이지 않아도 된다.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="메뉴 열기"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={24} />
      </button>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        className="drawer"
        onClose={() => setOpen(false)}
        // 배경(dialog 자신)을 누르면 닫는다. 안쪽을 누르면 target 이 달라 걸리지 않는다.
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-title">
              <span className="title-tag">먼가 작은</span>
              메뉴
            </span>
            <button type="button" className="menu-button" aria-label="메뉴 닫기" onClick={() => setOpen(false)}>
              <Icon name="close" size={22} />
            </button>
          </div>

          <nav aria-label="주요 메뉴">
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
          </nav>
        </div>
      </dialog>
    </>
  );
}
