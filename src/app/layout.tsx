import type { Metadata, Viewport } from 'next';
import { Gaegu, Gothic_A1, Noto_Sans_KR } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const display = Gothic_A1({ weight: ['600', '700', '800'], subsets: ['latin'], variable: '--font-display' });
// 페이지 타이틀에만 쓰는 귀여운 서체. 본문·카드는 산세리프를 유지한다.
const cute = Gaegu({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-cute' });
const body = Noto_Sans_KR({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: '치이카와 파인더', template: '%s | 치이카와 파인더' },
  description: '치이카와 인물, 온라인 콘텐츠, 팝업/매장 지도, 신상 굿즈를 한 곳에서',
  manifest: '/manifest.webmanifest',
  icons: '/icon.svg',
};

export const viewport: Viewport = { themeColor: '#fdfcfb', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} ${cute.variable}`}>
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
