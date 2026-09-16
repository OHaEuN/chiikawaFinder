import Script from 'next/script';

/**
 * 분석 스크립트. 환경변수가 있을 때만 붙는다.
 *
 * Plausible 은 쿠키를 쓰지 않아 동의 배너 없이 방문자 수와 이벤트를 볼 수 있다.
 * 다른 도구를 쓰더라도 `track()` 호출부는 그대로 두면 된다.
 */
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.tagged-events.js"
          strategy="afterInteractive"
        />
      )}
      {umamiId && (
        <Script defer data-website-id={umamiId} src="https://cloud.umami.is/script.js" strategy="afterInteractive" />
      )}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </>
  );
}
