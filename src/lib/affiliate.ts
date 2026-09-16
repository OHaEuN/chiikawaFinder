/**
 * 외부 구매 링크에 제휴 파라미터를 붙인다.
 *
 * 제휴 ID는 빌드 시 환경변수로 주입한다. 값이 없으면 원래 링크를 그대로 돌려주므로
 * 가입 전에도 사이트는 정상 동작한다. ID를 코드에 박지 않는 이유는 프로그램마다
 * 승인 시점이 다르고, 승인 전에 가짜 파라미터를 달면 링크가 깨지기 때문이다.
 */

interface AffiliateRule {
  /** 이 호스트로 끝나는 링크에 적용한다. */
  host: string;
  /** 붙일 쿼리 파라미터 이름 */
  param: string;
  /** 환경변수 이름 */
  env: string;
}

const RULES: AffiliateRule[] = [
  { host: 'buyee.jp', param: 'affiliate_id', env: 'NEXT_PUBLIC_AFF_BUYEE' },
  { host: 'zenmarket.jp', param: 'ref', env: 'NEXT_PUBLIC_AFF_ZENMARKET' },
  { host: 'amazon.co.jp', param: 'tag', env: 'NEXT_PUBLIC_AFF_AMAZON_JP' },
  { host: 'coupang.com', param: 'lptag', env: 'NEXT_PUBLIC_AFF_COUPANG' },
];

/** 정적 빌드라 process.env 를 빌드 시점에 인라인한다. 키를 동적으로 읽을 수 없어 나열한다. */
const IDS: Record<string, string | undefined> = {
  NEXT_PUBLIC_AFF_BUYEE: process.env.NEXT_PUBLIC_AFF_BUYEE,
  NEXT_PUBLIC_AFF_ZENMARKET: process.env.NEXT_PUBLIC_AFF_ZENMARKET,
  NEXT_PUBLIC_AFF_AMAZON_JP: process.env.NEXT_PUBLIC_AFF_AMAZON_JP,
  NEXT_PUBLIC_AFF_COUPANG: process.env.NEXT_PUBLIC_AFF_COUPANG,
};

const matchHost = (hostname: string, host: string) => hostname === host || hostname.endsWith(`.${host}`);

export const affiliateUrl = (rawUrl: string): string => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  const rule = RULES.find((r) => matchHost(url.hostname, r.host));
  const id = rule && IDS[rule.env];
  if (!rule || !id) return rawUrl;
  url.searchParams.set(rule.param, id);
  return url.toString();
};

/** 제휴 링크가 하나라도 활성화됐는지. 활성화됐으면 화면에 고지를 띄운다. */
export const hasAffiliate = Object.values(IDS).some(Boolean);
