import type { IconName } from './Icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/characters', label: '인물', icon: 'character' },
  { href: '/online', label: '온라인', icon: 'online' },
  { href: '/offline', label: '오프라인', icon: 'offline' },
  { href: '/calendar', label: '캘린더', icon: 'calendar' },
  { href: '/goods', label: '굿즈', icon: 'goods' },
  { href: '/calculator', label: '계산기', icon: 'calculator' },
];

/** 홈은 정확히 일치할 때만 현재 페이지다. 안 그러면 모든 경로에서 켜진다. */
export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);
