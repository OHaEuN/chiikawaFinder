'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateCost, DUTY_FREE_LIMIT_USD, FREE_DOMESTIC_SHIPPING_YEN, TAX_RATES, type CartLine, type TaxCategory } from '@/lib/cost';
import { track } from '@/lib/analytics';
import { matchesSearch, searchTerms, searchText } from '@/lib/search';
import { SafeImage } from '@/components/SafeImage';

interface Option {
  id: string;
  /** 공식몰 원문. 검색은 원문으로도 걸려야 한다. */
  name: string;
  /** 화면에 띄우는 한국어 이름 */
  nameKo: string;
  category: string;
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
const CART_STORAGE_KEY = 'chiikawa-calculator-cart';
const SETTINGS_STORAGE_KEY = 'chiikawa-calculator-settings';

interface SavedSettings {
  rate: string;
  /** 실환율을 그대로 쓰고 있었으면 다음 방문에는 그날의 실환율을 넣는다. */
  rateIsMarket: boolean;
  shipping: string;
  people: string;
  domestic: string;
  tax: TaxCategory;
}

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
const yen = (value: number) => `${value.toLocaleString('ko-KR')}엔`;

/**
 * 숫자 칸은 적은 글자 그대로 들고 있는다.
 * 매 글자를 숫자로 바꿔 되돌려 주면 칸을 비울 수도, 소수점을 찍을 수도 없다.
 */
const num = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return value.trim() === '' || Number.isNaN(parsed) ? fallback : parsed;
};

export function CostCalculator({ options, marketRate, usdPerJpy, rateUpdatedAt }: CostCalculatorProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [query, setQuery] = useState('');
  const [rateInput, setRateInput] = useState(String(marketRate));
  const [shippingInput, setShippingInput] = useState(String(DEFAULT_SHIPPING_KRW));
  const [peopleInput, setPeopleInput] = useState('1');
  const [domesticInput, setDomesticInput] = useState(String(DEFAULT_DOMESTIC_KRW));
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('toy');

  const appliedRate = num(rateInput);
  const shippingKrw = num(shippingInput);
  const people = Math.max(1, num(peopleInput, 1));
  const domesticKrw = num(domesticInput);

  /** 담은 상품이 있는지 다 읽기 전에 저장하면 빈 목록으로 덮어쓴다. */
  const [restored, setRestored] = useState(false);

  /**
   * 지난번에 담아 둔 상품을 되살리고, 굿즈 상세의 "계산기에 담기"로 넘어온 상품을 더한다.
   * 정적 사이트라 서버가 쿼리를 읽어 줄 수 없어 주소에서 직접 꺼낸다.
   */
  useEffect(() => {
    let saved: CartLine[] = [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      // 저장소를 막아 두었거나 내용이 깨졌으면 빈 장바구니로 시작한다.
    }
    // 스크랩으로 가격이 바뀌었을 수 있어 지금 목록의 값으로 맞춘다.
    const byId = new Map(options.map((o) => [o.id, o]));
    let next = (Array.isArray(saved) ? saved : [])
      .filter((l) => l && typeof l.id === 'string' && l.quantity > 0)
      .map((l) => {
        const option = byId.get(l.id);
        return option ? { ...l, name: option.nameKo, priceYen: option.priceYen } : l;
      });

    const url = new URL(window.location.href);
    const id = url.searchParams.get('add');
    const option = id && byId.get(id);
    if (option) {
      if (!next.some((l) => l.id === option.id)) next = [...next, { id: option.id, name: option.nameKo, priceYen: option.priceYen, quantity: 1 }];
      track('calculator_add_item', { from: 'goods' });
      // 새로고침할 때마다 다시 담기지 않게 주소를 정리한다.
      url.searchParams.delete('add');
      window.history.replaceState(null, '', url);
    }
    setLines(next);

    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings: Partial<SavedSettings> | null = raw ? JSON.parse(raw) : null;
      if (settings) {
        if (!settings.rateIsMarket && typeof settings.rate === 'string') setRateInput(settings.rate);
        if (typeof settings.shipping === 'string') setShippingInput(settings.shipping);
        if (typeof settings.people === 'string') setPeopleInput(settings.people);
        if (typeof settings.domestic === 'string') setDomesticInput(settings.domestic);
        if (settings.tax && settings.tax in TAX_RATES) setTaxCategory(settings.tax);
      }
    } catch {
      // 깨진 값이면 기본 조건으로 둔다.
    }
    setRestored(true);
  }, [options]);

  // 다른 페이지에 다녀와도 담은 상품이 남도록 바뀔 때마다 저장한다.
  useEffect(() => {
    if (!restored) return;
    try {
      if (lines.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
      else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // 저장에 실패해도 이번 방문에는 계산된다.
    }
  }, [lines, restored]);

  useEffect(() => {
    if (!restored) return;
    const settings: SavedSettings = {
      rate: rateInput,
      rateIsMarket: num(rateInput) === marketRate,
      shipping: shippingInput,
      people: peopleInput,
      domestic: domesticInput,
      tax: taxCategory,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // 저장에 실패해도 이번 방문에는 계산된다.
    }
  }, [restored, rateInput, shippingInput, peopleInput, domesticInput, taxCategory, marketRate]);

  const resetSettings = () => {
    setRateInput(String(marketRate));
    setShippingInput(String(DEFAULT_SHIPPING_KRW));
    setPeopleInput('1');
    setDomesticInput(String(DEFAULT_DOMESTIC_KRW));
    setTaxCategory('toy');
  };

  // 이름이 일본어뿐이라 한국어로 찾으면 안 나온다. 카테고리와 바꿔 쓰는 말까지 같이 본다.
  const index = useMemo(() => options.map((option) => ({ option, text: searchText(option) })), [options]);

  const matches = useMemo(() => {
    const terms = searchTerms(query);
    if (terms.length === 0) return [];
    return index.filter(({ text }) => matchesSearch(text, terms)).slice(0, SEARCH_RESULTS).map(({ option }) => option);
  }, [index, query]);

  const result = calculateCost({ lines, marketRate, appliedRate, shippingKrw, people, domesticKrw, usdPerJpy, taxCategory });

  const addLine = (option: Option) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === option.id);
      if (found) return prev.map((l) => (l.id === option.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { id: option.id, name: option.nameKo, priceYen: option.priceYen, quantity: 1 }];
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
          placeholder="상품명으로 검색 (예: 인형, 키링, 하치와레, マスコット)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.length > 0 && (
          <ul className="picker">
            {matches.map((o) => (
              <li key={o.id}>
                <button onClick={() => addLine(o)}>
                  <span className="picker-thumb"><SafeImage src={o.image} alt={o.nameKo} fallback="🎁" seed={o.id} width={48} /></span>
                  <span className="picker-name">{o.nameKo}</span>
                  <span className="picker-price">{yen(o.priceYen)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lines.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>위에서 상품을 검색해 담아 보세요.</p>
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
        {lines.length > 0 && (
          <button className="chip" style={{ marginTop: 8 }} onClick={() => setLines([])}>
            담은 상품 모두 비우기
          </button>
        )}

        <div className="freeship">
          <div className="freeship-bar"><span style={{ width: `${freeShippingPercent}%` }} /></div>
          <p className="muted">
            {result.toFreeShippingYen > 0
              ? `일본 내 배송 무료까지 ${yen(result.toFreeShippingYen)} 남았습니다. 이 금액을 넘기면 일본 내 배송료가 없어집니다. 공구 모집글의 '무배컷'이 이 기준입니다.`
              : `일본 내 배송 무료 기준(${yen(FREE_DOMESTIC_SHIPPING_YEN)})을 넘겨 일본 내 배송료가 없습니다.`}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>2. 조건을 맞추세요</h2>
        <div className="fields">
          <label>
            적용 환율 <span className="muted">(원/엔)</span>
            <input type="number" inputMode="decimal" step="0.01" min="0" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
          </label>
          <label>
            해외배송비 <span className="muted">(원, 전체)</span>
            <input type="number" inputMode="numeric" step="1000" min="0" value={shippingInput} onChange={(e) => setShippingInput(e.target.value)} />
          </label>
          <label>
            나눠 낼 인원
            <input type="number" inputMode="numeric" min="1" value={peopleInput} onChange={(e) => setPeopleInput(e.target.value)} />
          </label>
          <label>
            국내 택배비 <span className="muted">(원)</span>
            <input type="number" inputMode="numeric" step="500" min="0" value={domesticInput} onChange={(e) => setDomesticInput(e.target.value)} />
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
          <button className="chip" aria-pressed={appliedRate === marketRate} onClick={() => { setRateInput(String(marketRate)); track('calculator_rate_market'); }}>
            실환율 {marketRate.toFixed(2)}
          </button>
          {GROUPBUY_RATE_PRESETS.map((rate) => (
            <button key={rate} className="chip" aria-pressed={appliedRate === rate} onClick={() => { setRateInput(String(rate)); track('calculator_rate_groupbuy'); }}>
              공구 {rate.toFixed(1)}
            </button>
          ))}
          <button className="chip" onClick={resetSettings}>기본값으로</button>
        </div>
        <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10, marginBottom: 0 }}>
          실환율 기준일은 {rateUpdatedAt}입니다. 해외배송비와 국내 택배비는 기본값이라, 실제 공구 안내에 맞춰 바꿔 주세요.
        </p>
      </section>

      <section className="panel result">
        <h2>3. 결과</h2>
        <dl className="kv">
          <dt>상품 합계</dt><dd>{yen(result.subtotalYen)}</dd>
          {result.domesticJpYen > 0 && (
            <>
              <dt>일본 내 배송료</dt>
              <dd>{yen(result.domesticJpYen)} <span className="muted">(무배컷 미달)</span></dd>
            </>
          )}
          <dt>상품값</dt><dd>{won(result.goodsKrw)}</dd>
          <dt>해외배송비 분담</dt><dd>{won(result.shippingPerPersonKrw)} <span className="muted">({people}명이 나눔)</span></dd>
          <dt>국내 택배비</dt><dd>{won(domesticKrw)}</dd>
          {result.customs.taxable && (
            <>
              <dt>관세 · 부가세</dt>
              <dd>{won(result.customs.totalTaxKrw)}</dd>
            </>
          )}
        </dl>
        <p className="total">1인 부담 <strong>{won(result.totalKrw)}</strong></p>
        <p className="muted" style={{ fontSize: '0.82rem', marginTop: -6 }}>
          상품값과 세금은 내가 담은 몫을 그대로 내고, 나눠 내는 건 해외배송비뿐입니다.
        </p>

        {people > 1 && (
          <div className="customs">
            <strong>공구로 합배송하면 면세 한도는 상자 전체로 따집니다.</strong>
            <p>
              한 운송장으로 묶여 들어온 물건은 합산해서 {DUTY_FREE_LIMIT_USD}달러를 넘는지 봅니다.
              내 장바구니가 한도 안이어도 다른 참여자 몫과 합쳐 넘기면 전원이 과세 대상이 됩니다.
              여기 나온 세금은 내 장바구니만 따로 들어온다고 볼 때의 값입니다.
            </p>
          </div>
        )}

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
            <strong>이 환율에는 수수료 {won(result.rateMarkupKrw)}이 섞여 있습니다.</strong>
            <p>
              실환율 {marketRate.toFixed(2)}원으로 사면 상품값이 {won(result.goodsAtMarketKrw)}입니다.
              적용 환율 {appliedRate.toFixed(2)}원은 그보다 {result.rateMarkupPercent.toFixed(1)}% 비쌉니다.
                  공구는 배송비를 나누는 대신 환율에 수수료를 얹는 경우가 많습니다. 배송비를 아낀 만큼과 견줘 보세요.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
