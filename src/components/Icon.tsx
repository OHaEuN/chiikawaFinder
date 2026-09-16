interface IconProps {
  name: IconName;
  size?: number;
}

export type IconName = 'home' | 'character' | 'online' | 'offline' | 'goods' | 'calculator' | 'calendar';

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  character: (
    <>
      <circle cx="12" cy="13.5" r="6.5" />
      <circle cx="6.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <path d="M10 12.5h.01M14 12.5h.01" />
      <path d="M10.5 16c1 .9 2 .9 3 0" />
    </>
  ),
  online: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M8 7 12 3l4 4" />
      <path d="M10.5 11.5v4l3.5-2z" />
    </>
  ),
  offline: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
    </>
  ),
  calculator: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="3" />
      <rect x="7.5" y="6.5" width="9" height="3.5" rx="1" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01" />
    </>
  ),
  goods: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="2.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9S9.8 4.5 7.6 5.6 9.4 9 12 9zM12 9s2.2-4.5 4.4-3.4S14.6 9 12 9z" />
    </>
  ),
};

export function Icon({ name, size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
