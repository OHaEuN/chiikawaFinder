'use client';

import { useMemo, useState } from 'react';
import { calculateCost, DUTY_FREE_LIMIT_USD, FREE_DOMESTIC_SHIPPING_YEN, TAX_RATES, type CartLine, type TaxCategory } from '@/lib/cost';
import { track } from '@/lib/analytics';
import { SafeImage } from '@/components/SafeImage';

interface Option {
  id: string;
  name: string;
  priceYen: number;
  image?: string;
}

interface CostCalculatorProps {
  options: Option[];
  marketRate: number;
  usdPerJpy: number;
  rateUpdatedAt: string;
}

/** 공구 모집글에서 흔히 쓰는 적용 환율 */
const GROUPBUY_RATE_PRESETS = [9.5, 10];
const DEFAULT_SHIPPING_KRW = 25000;
const DEFAULT_DOMESTIC_KRW = 3500;
const SEARCH_RESULTS = 8;

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
const yen = (value: number) => `${value.toLocaleString('ko-KR')}엔`;

export function CostCalculator({ options, marketRate, usdPerJpy, rateUpdatedAt }: CostCalculatorProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [query, setQuery] = useState('');
  const [appliedRate, setAppliedRate] = useState(marketRate);
  const [shippingKrw, setShippingKrw] = useState(DEFAULT_SHIPPING_KRW);
  const [people, setPeople] = useState(1);
  const [domesticKrw, setDomesticKrw] = useState(DEFAULT_DOMESTIC_KRW);
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('toy');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, SEARCH_RESULTS);
  }, [options, query]);

  const result = calculateCost({ lines, marketRate, appliedRate, shippingKrw, people, domesticKrw, usdPerJpy, taxCategory });

  const addLine = (option: Option) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === option.id);
      if (found) return prev.map((l) => (l.id === option.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { id: option.id, name: option.name, priceYen: option.priceYen, quantity: 1 }];
    });
    setQuery('');
    track('calculator_add_item');
  };

  const setQuantity = (id: string, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity } : l))));

  const freeShippingPercent = Math.min(100, (result.subtotalYen / FREE_DOMESTIC_SHIPPING_YEN) * 100);

  return (
    <>
      <section className="panel">
        <h2>1. 살 상품을 담으세요</h2>
        <input
          className="search"
          type="search"
          placeholder="상품명으로 검색 (예: マスコット, ぬいぐるみ, キーホルダー)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <ul className="picker">
            {matches.map((o) => (
              <li key={o.id}>
                <button onClick={() => addLine(o)}>
                  <span className="picker-thumb"><SafeImage src={o.image} alt={o.name} fallback="🎁" seed={o.id} /></span>
                  <span className="picker-name">{o.name}</span>
                  <span className="picker-price">{yen(o.priceYen)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lines.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>아직 담은 상품이 없어요.</p>
        ) : (
          <ul className="cart">
            {lines.map((l) => (
              <li key={l.id}>
                <span className="cart-name">{l.name}</span>
                <span className="cart-price">{yen(l.priceYen)}</span>
                <span className="cart-qty">
                  <button onClick={() => setQuantity(l.id, l.quantity - 1)} aria-label="수량 줄이기">−</button>
                  <b>{l.quantity}</b>
                  <button onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label="수량 늘리기">+</button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="freeship">
          <div className="freeship-bar"><span style={{ width: `${freeShippingPercent}%` }} /></div>
          <p className="muted">
            {result.toFreeShippingYen > 0
              ? `일본 내 배송 무료까지 ${yen(result.toFreeShippingYen)} 남았어요. 공구 모집글의 '무배컷'이 이 기준입니다.`
              : `일본 내 배송 무료 기준(${yen(FREE_DOMESTIC_SHIPPING_YEN)})을 넘겼어요.`}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>2. 조건을 넣으세요</h2>
        <div className="fields">
          <label>
            적용 환율 <span className="muted">(원/엔)</span>
            <input type="number" step="0.01" min="0" value={appliedRate} onChange={(e) => setAppliedRate(Number(e.target.value))} />
          </label>
          <label>
            해외배송비 <span className="muted">(원, 전체)</span>
            <input type="number" step="1000" min="0" value={shippingKrw} onChange={(e) => setShippingKrw(Number(e.target.value))} />
          </label>
          <label>
            나눠 낼 인원
            <input type="number" min="1" value={people} onChange={(e) => setPeople(Number(e.target.value))} />
          </label>
          <label>
            국내 택배비 <span className="muted">(원)</span>
            <input type="number" step="500" min="0" value={domesticKrw} onChange={(e) => setDomesticKrw(Number(e.target.value))} />
          </label>
          <label>
            품목
            <select value={taxCategory} onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}>
              {(Object.keys(TAX_RATES) as TaxCategory[]).map((key) => (
                <option key={key} value={key}>{TAX_RATES[key].label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="chips" style={{ marginBottom: 0 }}>
          <button className="chip" aria-pressed={appliedRate === marketRate} onClick={() => { setAppliedRate(marketRate); track('calculator_rate_market'); }}>
            실환율 {marketRate.toFixed(2)}
          </button>
          {GROUPBUY_RATE_PRESETS.map((rate) => (
            <button key={rate} className="chip" aria-pressed={appliedRate === rate} onClick={() => { setAppliedRate(rate); track('calculator_rate_groupbuy'); }}>
              공구 {rate.toFixed(1)}
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10, marginBottom: 0 }}>
          실환율 기준일 {rateUpdatedAt}. 해외배송비와 국내 택배비는 기본값이니 실제 공구 안내에 맞춰 고치세요.
        </p>
      </section>

      <section className="panel result">
        <h2>3. 결과</h2>
        <dl className="kv">
          <dt>상품 합계</dt><dd>{yen(result.subtotalYen)}</dd>
          <dt>상품값</dt><dd>{won(result.goodsKrw)}</dd>
          <dt>배송비 분담</dt><dd>{won(result.shippingPerPersonKrw)} <span className="muted">({people}명이 나눔)</span></dd>
          <dt>국내 택배비</dt><dd>{won(domesticKrw)}</dd>
          {result.customs.taxable && (
            <>
              <dt>관세 · 부가세</dt>
              <dd>{won(Math.round(result.customs.totalTaxKrw / Math.max(1, people)))} <span className="muted">(전체 {won(result.customs.totalTaxKrw)})</span></dd>
            </>
          )}
        </dl>
        <p className="total">1인 부담 <strong>{won(result.totalKrw)}</strong></p>

        {result.subtotalYen > 0 && (
          result.customs.taxable ? (
            <div className="customs customs-over">
              <strong>면세 한도 {DUTY_FREE_LIMIT_USD}달러를 넘겨 세금이 붙습니다.</strong>
              <p>
                물품가격이 {result.customs.goodsValueUsd.toFixed(0)}달러입니다.
                한도를 넘기면 초과분만이 아니라 <strong>전체 금액</strong>에 과세되고, 과세가격에는 국제배송비도 들어갑니다.
                관세 {won(result.customs.dutyKrw)}에 부가세 {won(result.customs.vatKrw)}이 더해져 모두 {won(result.customs.totalTaxKrw)}입니다.
                장바구니를 {DUTY_FREE_LIMIT_USD}달러 아래로 줄여 나눠 받으면 이 금액을 아낄 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="customs">
              <strong>면세 한도까지 {yen(result.customs.toLimitYen)} 남았습니다.</strong>
              <p>
                물품가격 {result.customs.goodsValueUsd.toFixed(0)}달러입니다. {DUTY_FREE_LIMIT_USD}달러를 넘으면 전체 금액에
                관세와 부가세가 붙어 {(TAX_RATES[taxCategory].duty * 100).toFixed(0)}%에 부가세까지 더 내야 합니다.
              </p>
            </div>
          )
        )}

        {result.rateMarkupKrw > 0 && (
          <div className="markup">
            <strong>이 환율에는 수수료 {won(result.rateMarkupKrw)}이 섞여 있어요.</strong>
            <p>
              실환율 {marketRate.toFixed(2)}원으로 사면 상품값이 {won(result.goodsAtMarketKrw)}입니다.
              적용 환율 {appliedRate.toFixed(2)}원은 그보다 {result.rateMarkupPercent.toFixed(1)}% 비쌉니다.
                  공구는 배송비를 나누는 대신 환율에 수수료를 얹는 경우가 많습니다. 배송비 절감분과 견줘 보세요.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
