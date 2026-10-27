'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
  /** 화면에 띄울 실환율 기준일 (예: 10월 26일) */
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
  const parsed = Number(value.replaceAll(',', ''));
  return value.trim() === '' || Number.isNaN(parsed) ? fallback : parsed;
};


interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}

/**
 * 단위를 칸 안쪽 끝에 붙여 라벨이 한 줄로 끝나게 한다.
 * 라벨 옆에 단위를 따로 적으면 칸마다 라벨 높이가 달라져 입력칸 높이가 들쑥날쑥해진다.
 * 금액은 67,000 처럼 쉼표를 찍어 보여 준다. 쉼표가 들어가고 빠져도 커서가 끝으로 튀지 않게
 * 커서 앞 숫자 개수를 세어 두었다가 같은 자리에 되돌린다.
 */
function NumberField({ id, label, unit, value, onChange, hint }: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitsBeforeCaret = useRef<number | null>(null);
  const shown = value === '' ? '' : num(value).toLocaleString('ko-KR');

  useLayoutEffect(() => {
    const input = inputRef.current;
    const digits = digitsBeforeCaret.current;
    if (!input || digits === null || document.activeElement !== input) return;
    digitsBeforeCaret.current = null;
    let position = 0;
    for (let seen = 0; position < shown.length && seen < digits; position++) {
      if (/\d/.test(shown[position])) seen++;
    }
    input.setSelectionRange(position, position);
  }, [shown]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-unit">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={shown}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const caret = e.target.selectionStart ?? e.target.value.length;
            digitsBeforeCaret.current = e.target.value.slice(0, caret).replace(/\D/g, '').length;
            // 앞자리 0 은 떼어 쉼표 자리와 숫자가 어긋나지 않게 한다.
            onChange(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''));
          }}
        />
        <span className="unit" aria-hidden="true">{unit}</span>
      </div>
      <p className="field-hint">{hint}</p>
    </div>
  );
}

export function CostCalculator({ options, marketRate, usdPerJpy, rateUpdatedAt }: CostCalculatorProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [query, setQuery] = useState('');
  const [rateInput, setRateInput] = useState(String(marketRate));
  const [shippingInput, setShippingInput] = useState(String(DEFAULT_SHIPPING_KRW));
  const [peopleInput, setPeopleInput] = useState('1');
  const [domesticInput, setDomesticInput] = useState(String(DEFAULT_DOMESTIC_KRW));
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('toy');
  /** 모두 비우기를 잘못 눌렀을 때 되돌릴 수 있게 잠깐 들고 있는다. */
  const [cleared, setCleared] = useState<CartLine[] | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [resultVisible, setResultVisible] = useState(true);

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

  useEffect(() => {
    const el = resultRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setResultVisible(entry.isIntersecting), { rootMargin: '0px 0px -80px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    setCleared(null);
    track('calculator_add_item');
  };

  const setQuantity = (id: string, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity } : l))));

  const removeAll = () => {
    setCleared(lines);
    setLines([]);
  };

  const undoRemoveAll = () => {
    if (cleared) setLines(cleared);
    setCleared(null);
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter 는 글자를 확정하는 키라 담지 않는다.
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && matches[0]) {
      e.preventDefault();
      addLine(matches[0]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const freeShippingPercent = Math.min(100, (result.subtotalYen / FREE_DOMESTIC_SHIPPING_YEN) * 100);
  const quantityById = new Map(lines.map((l) => [l.id, l.quantity]));
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const hasItems = lines.length > 0;
  const searching = searchTerms(query).length > 0;

  const rateHint =
    appliedRate > marketRate
      ? `실환율 ${marketRate.toFixed(2)}보다 ${(((appliedRate - marketRate) / marketRate) * 100).toFixed(1)}% 비쌉니다.`
      : `${rateUpdatedAt} 실환율 기준입니다.`;

  return (
    <div className="calc-layout">
      <div className="calc-inputs">
        <section className="panel">
          <h2>1. 살 상품을 담으세요</h2>
          <input
            className="search"
            type="search"
            placeholder="상품명으로 검색 (예: 인형, 키링, 하치와레, マスコット)"
            aria-label="상품 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
          />
          {matches.length > 0 && (
            <ul className="picker">
              {matches.map((o) => (
                <li key={o.id}>
                  <button onClick={() => addLine(o)}>
                    <span className="picker-thumb"><SafeImage src={o.image} alt={o.nameKo} fallback="🎁" seed={o.id} width={48} /></span>
                    <span className="picker-name">{o.nameKo}</span>
                    {quantityById.has(o.id) && <span className="picker-in">{quantityById.get(o.id)}개 담김</span>}
                    <span className="picker-price">{yen(o.priceYen)}</span>
                    <span className="picker-add" aria-hidden="true">＋</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searching && matches.length === 0 && (
            <p className="muted picker-empty">&lsquo;{query.trim()}&rsquo;에 맞는 상품이 없습니다. 다른 말로 찾아보세요.</p>
          )}

          {!hasItems ? (
            cleared ? (
              <p className="muted cart-empty">
                담은 상품을 비웠습니다.{' '}
                <button className="link-button" onClick={undoRemoveAll}>되돌리기</button>
              </p>
            ) : (
              <p className="muted cart-empty">위에서 상품을 검색해 담아 보세요. 굿즈 상세의 &lsquo;계산기에 담기&rsquo;로도 담깁니다.</p>
            )
          ) : (
            <>
              <div className="cart-head">
                <span>담은 상품 {itemCount}개</span>
                <button className="link-button" onClick={removeAll}>모두 비우기</button>
              </div>
              <ul className="cart">
                {lines.map((l) => (
                  <li key={l.id}>
                    <span className="cart-name">{l.name}</span>
                    <span className="cart-price">
                      {yen(l.priceYen * l.quantity)}
                      {l.quantity > 1 && <small> ({yen(l.priceYen)} × {l.quantity})</small>}
                    </span>
                    <span className="cart-qty">
                      <button onClick={() => setQuantity(l.id, l.quantity - 1)} aria-label={l.quantity === 1 ? `${l.name} 빼기` : '수량 줄이기'}>
                        {l.quantity === 1 ? '×' : '−'}
                      </button>
                      <b>{l.quantity}</b>
                      <button onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label="수량 늘리기">+</button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {hasItems && (
            <div className="freeship">
              <div className="freeship-bar"><span style={{ width: `${freeShippingPercent}%` }} /></div>
              <p className="muted">
                {result.toFreeShippingYen > 0
                  ? `일본 내 배송 무료까지 ${yen(result.toFreeShippingYen)} 남았습니다. 공구 모집글의 '무배컷'이 이 기준(${yen(FREE_DOMESTIC_SHIPPING_YEN)})입니다.`
                  : `일본 내 배송 무료 기준(${yen(FREE_DOMESTIC_SHIPPING_YEN)})을 넘겨 일본 내 배송료가 없습니다.`}
              </p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>2. 조건을 맞추세요</h2>
            <button className="link-button" onClick={resetSettings}>기본값으로</button>
          </div>

          <div className="fields">
            <div className="field field-wide">
              <label htmlFor="calc-rate">적용 환율</label>
              <div className="rate-row">
                <div className="input-unit">
                  <input
                    id="calc-rate"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={rateInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRateInput(e.target.value.replace(/[^\d.]/g, ''))}
                  />
                  <span className="unit" aria-hidden="true">원/엔</span>
                </div>
                <div className="rate-presets" role="group" aria-label="환율 빠르게 고르기">
                  <button className="chip" aria-pressed={appliedRate === marketRate} onClick={() => { setRateInput(String(marketRate)); track('calculator_rate_market'); }}>
                    실환율 {marketRate.toFixed(2)}
                  </button>
                  {GROUPBUY_RATE_PRESETS.map((rate) => (
                    <button key={rate} className="chip" aria-pressed={appliedRate === rate} onClick={() => { setRateInput(String(rate)); track('calculator_rate_groupbuy'); }}>
                      공구 {rate.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="field-hint">{rateHint}</p>
            </div>

            <NumberField
              id="calc-shipping"
              label="해외배송비 (전체)"
              unit="원"
              value={shippingInput}
              onChange={setShippingInput}
              hint="공구 안내에 적힌 배송비 총액"
            />

            <div className="field">
              <label htmlFor="calc-people">나눠 낼 인원</label>
              <div className="stepper">
                <button onClick={() => setPeopleInput(String(Math.max(1, people - 1)))} disabled={people <= 1} aria-label="인원 줄이기">−</button>
                <div className="input-unit">
                  <input
                    id="calc-people"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={peopleInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPeopleInput(e.target.value.replace(/[^\d]/g, ''))}
                    onBlur={() => setPeopleInput(String(people))}
                  />
                  <span className="unit" aria-hidden="true">명</span>
                </div>
                <button onClick={() => setPeopleInput(String(people + 1))} aria-label="인원 늘리기">+</button>
              </div>
              <p className="field-hint">{people > 1 ? `배송비 1인 ${won(result.shippingPerPersonKrw)}` : '혼자 사면 1명'}</p>
            </div>

            <NumberField
              id="calc-domestic"
              label="국내 택배비"
              unit="원"
              value={domesticInput}
              onChange={setDomesticInput}
              hint="공구장이 내게 보내는 택배비"
            />

            <div className="field">
              <span className="field-label" id="calc-tax-label">품목</span>
              <div className="segmented" role="radiogroup" aria-labelledby="calc-tax-label">
                {(Object.keys(TAX_RATES) as TaxCategory[]).map((key) => (
                  <button key={key} role="radio" aria-checked={taxCategory === key} onClick={() => setTaxCategory(key)}>
                    {TAX_RATES[key].label}
                  </button>
                ))}
              </div>
              <p className="field-hint">면세 한도를 넘으면 관세 {(TAX_RATES[taxCategory].duty * 100).toFixed(0)}%</p>
            </div>
          </div>
        </section>
      </div>

      <section className="panel result calc-result" ref={resultRef}>
        <h2>3. 결과</h2>
        {!hasItems ? (
          <p className="muted result-empty">상품을 담으면 1인 부담 금액이 여기 나옵니다.</p>
        ) : (
          <>
            <p className="total">1인 부담 <strong>{won(result.totalKrw)}</strong></p>
            <dl className="kv">
              <dt>상품 합계</dt><dd>{yen(result.subtotalYen)}</dd>
              {result.domesticJpYen > 0 && (
                <>
                  <dt>일본 내 배송료</dt>
                  <dd>{yen(result.domesticJpYen)} <span className="muted">(무배컷 미달)</span></dd>
                </>
              )}
              <dt>상품값</dt><dd>{won(result.goodsKrw)} <span className="muted">(× {appliedRate.toFixed(2)})</span></dd>
              <dt>해외배송비 분담</dt><dd>{won(result.shippingPerPersonKrw)} <span className="muted">({people}명이 나눔)</span></dd>
              <dt>국내 택배비</dt><dd>{won(domesticKrw)}</dd>
              {result.customs.taxable && (
                <>
                  <dt>관세 · 부가세</dt>
                  <dd>{won(result.customs.totalTaxKrw)}</dd>
                </>
              )}
            </dl>
            <p className="muted result-note">
              상품값과 세금은 내가 담은 몫을 그대로 내고, 나눠 내는 건 해외배송비뿐입니다.
            </p>

            {result.customs.taxable ? (
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
            )}

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
          </>
        )}
      </section>

      {/* 좁은 화면에서는 결과가 맨 아래라 조건을 바꿀 때마다 내려가 봐야 한다. 금액만 아래에 띄워 둔다. */}
      {hasItems && !resultVisible && (
        <button className="calc-total-bar" onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <span>{itemCount}개 · 1인 부담</span>
          <strong>{won(result.totalKrw)}</strong>
          <span className="calc-total-bar-more" aria-hidden="true">결과 보기 ↓</span>
        </button>
      )}
    </div>
  );
}
