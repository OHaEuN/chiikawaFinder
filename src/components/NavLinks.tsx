import Link from 'next/link';
import { Icon } from './Icon';
import { NAV_ITEMS, NAV_PREFIX, isActivePath } from './nav';

interface NavLinksProps {
  pathname: string;
}

/** 사이드바와 모바일 서랍이 같은 목록을 쓴다. 한 곳에서만 고치면 되도록 묶는다. */
export function NavLinks({ pathname }: NavLinksProps) {
  return (
    <ul>
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link href={item.href} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}>
            <Icon name={item.icon} />
            <span className="nav-label">
              <span className="nav-prefix">{NAV_PREFIX}</span>
              {item.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
