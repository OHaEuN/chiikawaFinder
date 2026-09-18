import type { Metadata, Viewport } from 'next';
import { Gaegu, Noto_Sans_KR } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { asset } from '@/lib/asset';
import { Analytics } from '@/components/Analytics';
import './globals.css';

/*
 * 한글 웹폰트는 글자 범위별로 백 개 넘는 조각으로 쪼개져 온다.
 * preload 를 켜면 그 조각을 전부 미리 받느라 2MB 가 넘고, 그동안 글자가 기본 글씨체로 보이다 바뀐다.
 * 끄면 브라우저가 화면에 실제로 쓰인 글자의 조각만 가져온다.
 *
 * 굵기도 쓰는 것만 남겼다. 하나 늘릴 때마다 조각 수가 그만큼 곱해진다.
 */
const body = Noto_Sans_KR({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
});
// 페이지 타이틀에만 쓰는 귀여운 서체. 본문·카드는 산세리프를 유지한다.
const cute = Gaegu({
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-cute',
  display: 'swap',
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ohaeun.github.io/chiikawaFinder/';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: '치이카와 파인더', template: '%s | 치이카와 파인더' },
  description: '치이카와 인물, 온라인 콘텐츠, 팝업/매장 지도, 신상 굿즈를 한 곳에서',
  // 제목과 설명은 페이지마다 쓰는 값을 그대로 물려받는다.
  openGraph: {
    type: 'website',
    siteName: '치이카와 파인더',
    locale: 'ko_KR',
    url: './',
    images: [{ url: './og.png', width: 1200, height: 630, alt: '치이카와 파인더' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['./og.png'],
  },
  icons: {
    icon: [
      { url: asset('/favicon.ico'), sizes: '48x48' },
      { url: asset('/icon-192.png'), type: 'image/png', sizes: '192x192' },
    ],
    apple: asset('/apple-icon.png'),
  },
};

/** 커서 그림 주소. CSS 에서는 배포 경로를 알 수 없어 여기서 변수로 내려 준다. */
const CURSOR_KEYS = ['chiikawa', 'hachiware', 'usagi'] as const;
const cursorVars = Object.fromEntries(
  CURSOR_KEYS.flatMap((key) => [
    [`--cursor-${key}-idle`, `url('${asset(`/cursor/${key}.png`)}')`],
    [`--cursor-${key}-hover`, `url('${asset(`/cursor/${key}-hover.png`)}')`],
  ]),
) as React.CSSProperties;

export const viewport: Viewport = { themeColor: '#fdfcfb', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${body.variable} ${cute.variable}`} style={cursorVars}>
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
