/**
 * 공식몰 이미지는 원본 그대로 온다. 카드에 170px 로 띄우면서 291KB 를 받는 식이다.
 *
 * 굿즈 2,314개 중 2,294개가 Shopify CDN 에 있고, 이 CDN 은 주소에 width 를 붙이면
 * 그 폭으로 줄여 준다. 200px 짜리는 11KB, 400px 짜리는 35KB 로 떨어진다.
 * 줄이기를 지원하지 않는 다른 CDN 은 원본을 그대로 쓴다.
 */
const RESIZABLE = 'cdn.shopify.com';

export const canResize = (src: string) => src.includes(RESIZABLE);

const atWidth = (src: string, width: number) => `${src}${src.includes('?') ? '&' : '?'}width=${width}`;

/**
 * 화면에서 차지하는 폭을 주면 1배·2배 두 벌을 만든다.
 * 고해상도 화면인지 브라우저가 알아서 고르게 두는 편이 기기마다 재는 것보다 정확하다.
 */
export function imageSources(src: string, width: number) {
  if (!canResize(src)) return { src, srcSet: undefined, sizes: undefined };
  return {
    src: atWidth(src, width),
    srcSet: `${atWidth(src, width)} ${width}w, ${atWidth(src, width * 2)} ${width * 2}w`,
    sizes: `${width}px`,
  };
}
