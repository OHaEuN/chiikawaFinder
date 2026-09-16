import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCost, calculateCustoms, DUTY_FREE_LIMIT_USD, FREE_DOMESTIC_SHIPPING_YEN, type CostInput } from './cost.ts';

const USD_PER_JPY = 0.006448; // 150달러 = 약 23,263엔

const base: CostInput = {
  lines: [{ id: 'a', name: '마스코트', priceYen: 2200, quantity: 1 }],
  marketRate: 8.77,
  appliedRate: 8.77,
  shippingKrw: 0,
  people: 1,
  domesticKrw: 0,
  usdPerJpy: USD_PER_JPY,
  taxCategory: 'toy',
};

test('직접 직구면 환율 마진이 0이다', () => {
  const r = calculateCost(base);
  assert.equal(r.subtotalYen, 2200);
  assert.equal(r.rateMarkupKrw, 0);
  assert.equal(r.totalKrw, r.goodsKrw);
});

test('공구 환율이 높으면 숨은 수수료가 드러난다', () => {
  const r = calculateCost({ ...base, appliedRate: 10 });
  assert.equal(r.goodsKrw, 22000);
  assert.equal(r.goodsAtMarketKrw, 19294);
  assert.equal(r.rateMarkupKrw, 2706);
  assert.ok(r.rateMarkupPercent > 13 && r.rateMarkupPercent < 15);
});

test('배송비를 인원수로 나눈다', () => {
  const r = calculateCost({ ...base, shippingKrw: 30000, people: 4, domesticKrw: 3000 });
  assert.equal(r.shippingPerPersonKrw, 7500);
  assert.equal(r.totalKrw, r.goodsKrw + 7500 + 3000);
});

test('인원이 0이어도 계산이 깨지지 않는다', () => {
  assert.equal(calculateCost({ ...base, shippingKrw: 30000, people: 0 }).shippingPerPersonKrw, 30000);
});

test('무배컷까지 남은 금액을 알려준다', () => {
  assert.equal(calculateCost(base).toFreeShippingYen, FREE_DOMESTIC_SHIPPING_YEN - 2200);
  assert.equal(calculateCost({ ...base, lines: [{ id: 'a', name: 'x', priceYen: 12000, quantity: 1 }] }).toFreeShippingYen, 0);
});

test('수량과 여러 상품을 합산한다', () => {
  const r = calculateCost({
    ...base,
    lines: [
      { id: 'a', name: 'x', priceYen: 2200, quantity: 3 },
      { id: 'b', name: 'y', priceYen: 1650, quantity: 2 },
    ],
  });
  assert.equal(r.subtotalYen, 2200 * 3 + 1650 * 2);
});

test('장바구니가 비면 0으로 떨어진다', () => {
  const r = calculateCost({ ...base, lines: [] });
  assert.equal(r.subtotalYen, 0);
  assert.equal(r.totalKrw, 0);
  assert.equal(r.customs.taxable, false);
});

test('면세 한도 안이면 세금이 붙지 않는다', () => {
  const c = calculateCustoms({ subtotalYen: 20000, shippingKrw: 25000, marketRate: 8.77, usdPerJpy: USD_PER_JPY, taxCategory: 'toy' });
  assert.equal(c.taxable, false);
  assert.equal(c.totalTaxKrw, 0);
  assert.ok(c.goodsValueUsd < DUTY_FREE_LIMIT_USD);
  assert.ok(c.toLimitYen > 3000 && c.toLimitYen < 3500);
});

test('한도 판정에는 국제운임을 넣지 않는다', () => {
  const withShipping = calculateCustoms({ subtotalYen: 23000, shippingKrw: 200000, marketRate: 8.77, usdPerJpy: USD_PER_JPY, taxCategory: 'toy' });
  assert.equal(withShipping.taxable, false);
});

test('한도를 넘으면 국제운임을 더한 금액 전체에 과세한다', () => {
  const c = calculateCustoms({ subtotalYen: 30000, shippingKrw: 25000, marketRate: 8.77, usdPerJpy: USD_PER_JPY, taxCategory: 'toy' });
  assert.equal(c.taxable, true);
  const dutiable = 30000 * 8.77 + 25000; // 288,100원
  assert.equal(c.dutyKrw, Math.round(dutiable * 0.08));
  assert.equal(c.vatKrw, Math.round((dutiable + c.dutyKrw) * 0.1));
  // 관세 8% + 부가세 10% 를 겹쳐 실효 18.8%
  assert.ok(Math.abs(c.totalTaxKrw / dutiable - 0.188) < 0.001);
});

test('의류는 세율이 더 높다', () => {
  const args = { subtotalYen: 30000, shippingKrw: 25000, marketRate: 8.77, usdPerJpy: USD_PER_JPY } as const;
  const toy = calculateCustoms({ ...args, taxCategory: 'toy' });
  const apparel = calculateCustoms({ ...args, taxCategory: 'apparel' });
  assert.ok(apparel.totalTaxKrw > toy.totalTaxKrw);
});

test('세금도 인원수로 나눠 1인 부담에 더한다', () => {
  const r = calculateCost({ ...base, lines: [{ id: 'a', name: 'x', priceYen: 30000, quantity: 1 }], shippingKrw: 25000, people: 5 });
  assert.equal(r.customs.taxable, true);
  const expected = r.goodsKrw + r.shippingPerPersonKrw + Math.round(r.customs.totalTaxKrw / 5);
  assert.equal(r.totalKrw, expected);
});
