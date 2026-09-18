/**
 * public/ 안의 파일을 가리키는 경로를 만든다.
 *
 * GitHub Pages 프로젝트 저장소는 /저장소이름 아래에서 서비스된다.
 * next/link 와 next/image 는 Next 가 알아서 앞에 붙여 주지만
 * 직접 쓴 <img src>, CSS url(), manifest 는 그대로 나가 깨진다. 이 함수로 감싼다.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 외부 주소는 건드리지 않는다. 굿즈 사진은 Shopify CDN 을 그대로 쓴다. */
export const asset = (path: string): string =>
  path.startsWith('/') ? `${BASE_PATH}${path}` : path;
