/**
 * public/ 안의 파일을 가리키는 경로를 만든다.
 *
 * 지금은 도메인 루트(Vercel)에서 서비스해 앞에 붙는 경로가 없다.
 * 다시 하위 경로로 옮기면 next.config.ts 의 basePath 와 NEXT_PUBLIC_BASE_PATH 를 함께 채운다.
 * next/link 와 next/image 는 Next 가 알아서 붙이지만 직접 쓴 <img src>, CSS url(), manifest 는 이 함수로 감싼다.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 외부 주소는 건드리지 않는다. 굿즈 사진은 Shopify CDN 을 그대로 쓴다. */
export const asset = (path: string): string =>
  path.startsWith('/') ? `${BASE_PATH}${path}` : path;
