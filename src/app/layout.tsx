import type { Metadata, Viewport } from 'next';
import { Gaegu, Gowun_Dodum } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const display = Gaegu({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-display' });
const body = Gowun_Dodum({ weight: '400', subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: '치이카와 파인더', template: '%s | 치이카와 파인더' },
  description: '치이카와 인물, 온라인 콘텐츠, 팝업/매장 지도, 신상 굿즈를 한 곳에서',
  manifest: '/manifest.webmanifest',
  icons: '/icon.svg',
};

export const viewport: Viewport = { themeColor: '#fbf7ee', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body>
        <SiteHeader />
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
