import type { MetadataRoute } from 'next';
import { asset } from '@/lib/asset';

/** 정적 내보내기에서는 메타데이터 라우트도 고정으로 선언해야 한다. */
export const dynamic = 'force-static';

/**
 * 정적 파일로 두면 아이콘 주소에 배포 경로가 안 붙는다. 코드로 만들어 asset 을 태운다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '치이카와 파인더',
    short_name: '치이카와',
    start_url: asset('/'),
    display: 'standalone',
    background_color: '#fbf7ee',
    theme_color: '#fbf7ee',
    icons: [
      { src: asset('/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: asset('/icon.png'), sizes: '512x512', type: 'image/png' },
    ],
  };
}
