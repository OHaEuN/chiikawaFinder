import { test } from 'node:test';
import assert from 'node:assert/strict';

/** src/lib/affiliate.ts 와 같은 규칙. 빌드 없이 검증하려고 로직만 옮겼다. */
const RULES = [
  { host: 'chiikawamarket.jp', param: 'utm_source', env: 'AFF_CM' },
  { host: 'amazon.co.jp', param: 'tag', env: 'AFF_AMZ' },
];
const matchHost = (hostname, host) => hostname === host || hostname.endsWith(`.${host}`);

const affiliateUrl = (rawUrl, ids) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  const rule = RULES.find((r) => matchHost(url.hostname, r.host));
  const id = rule && ids[rule.env];
  if (!rule || !id) return rawUrl;
  url.searchParams.set(rule.param, id);
  return url.toString();
};

test('제휴 ID가 없으면 링크를 그대로 둔다', () => {
  const url = 'https://chiikawamarket.jp/products/4571609401234';
  assert.equal(affiliateUrl(url, {}), url);
});

test('ID가 있으면 파라미터를 붙인다', () => {
  const out = affiliateUrl('https://chiikawamarket.jp/products/abc', { AFF_CM: 'chiikawafinder' });
  assert.equal(out, 'https://chiikawamarket.jp/products/abc?utm_source=chiikawafinder');
});

test('서브도메인도 같은 규칙을 탄다', () => {
  const out = affiliateUrl('https://www.amazon.co.jp/dp/B01', { AFF_AMZ: 'mytag-22' });
  assert.equal(out, 'https://www.amazon.co.jp/dp/B01?tag=mytag-22');
});

test('규칙에 없는 호스트는 건드리지 않는다', () => {
  const url = 'https://www.musinsa.com/products/6899335';
  assert.equal(affiliateUrl(url, { AFF_CM: 'x' }), url);
});

test('기존 쿼리는 유지하고 덮어쓰지 않는다', () => {
  const out = affiliateUrl('https://chiikawamarket.jp/products/abc?v=1', { AFF_CM: 'cf' });
  assert.ok(out.includes('v=1') && out.includes('utm_source=cf'));
});

test('URL이 아니면 그대로 돌려준다', () => {
  assert.equal(affiliateUrl('나중에 확인', {}), '나중에 확인');
});
