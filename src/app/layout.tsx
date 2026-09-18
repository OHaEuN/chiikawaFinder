import type { Metadata, Viewport } from 'next';
import { Gaegu, Gothic_A1, Noto_Sans_KR } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { asset } from '@/lib/asset';
import { Analytics } from '@/components/Analytics';
import './globals.css';

const display = Gothic_A1({ weight: ['600', '700', '800'], subsets: ['latin'], variable: '--font-display' });
// 페이지 타이틀에만 쓰는 귀여운 서체. 본문·카드는 산세리프를 유지한다.
const cute = Gaegu({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-cute' });
const body = Noto_Sans_KR({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-body' });

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
    <html lang="ko" className={`${display.variable} ${body.variable} ${cute.variable}`} style={cursorVars}>
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
