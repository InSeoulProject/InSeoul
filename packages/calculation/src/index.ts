/** D-Day(골든크로스) 계산 — 기획서 6장 공식. 동일 입력 → 동일 결과(NFR-03). */

export interface GoldenCrossParams {
  cashAsset: number;
  jeonseDeposit: number;
  monthlySaving: number;
  targetPrice: number;
  /** 대출 가능 비율 (0~1) */
  ltv: number;
  /** 연간 주택가격 상승률 (예: 0.03) */
  expectedGrowthRate: number;
  /** 취득세 및 부대비용 비율 (예: 0.011) */
  acquisitionTaxRate: number;
  /** 자산 월수익률 (기본 0 = 순수 저축 누적) */
  monthlyReturnRate?: number;
  /** 탐색 상한(개월). 기본 600(50년) */
  maxMonths?: number;
}

export interface GoldenCrossResult {
  /** 골든크로스 달성 개월 (도달 불가 시 null) */
  dDayMonths: number | null;
  /** 달성 시점 필요 자기자본 */
  requiredCapital: number;
  /** 달성 시점 보유 가능 자산 */
  availableAsset: number;
  /** 달성 시점 목표 주택 가격 */
  targetPriceAtPurchase: number;
}

/** t개월 후 자산: 초기자산(현금+전세) 복리 + 월저축 적립. */
export function assetAt(
  initialAsset: number,
  monthlySaving: number,
  months: number,
  r: number,
): number {
  if (r <= 0) return initialAsset + monthlySaving * months;
  const growth = Math.pow(1 + r, months);
  return initialAsset * growth + monthlySaving * ((growth - 1) / r);
}

/** t개월 후 목표가: 연간 상승률을 월 환산 복리. */
export function targetPriceAt(targetPrice: number, annualGrowth: number, months: number): number {
  return targetPrice * Math.pow(1 + annualGrowth, months / 12);
}

/** t개월 후 필요 자기자본 = 가격*(1-LTV) + 취득세/부대비용. */
export function requiredCapitalAt(
  targetPrice: number,
  annualGrowth: number,
  ltv: number,
  acquisitionTaxRate: number,
  months: number,
): number {
  const p = targetPriceAt(targetPrice, annualGrowth, months);
  return p * (1 - ltv) + p * acquisitionTaxRate;
}

/** 자산선 A(t) ≥ 필요 자기자본 P(t) 를 만족하는 최소 t(개월). */
export function goldenCross(params: GoldenCrossParams): GoldenCrossResult {
  const {
    cashAsset,
    jeonseDeposit,
    monthlySaving,
    targetPrice,
    ltv,
    expectedGrowthRate,
    acquisitionTaxRate,
    monthlyReturnRate = 0,
    maxMonths = 600,
  } = params;
  const initial = cashAsset + jeonseDeposit;

  for (let t = 0; t <= maxMonths; t++) {
    const asset = assetAt(initial, monthlySaving, t, monthlyReturnRate);
    const required = requiredCapitalAt(targetPrice, expectedGrowthRate, ltv, acquisitionTaxRate, t);
    if (asset >= required) {
      return {
        dDayMonths: t,
        requiredCapital: Math.round(required),
        availableAsset: Math.round(asset),
        targetPriceAtPurchase: Math.round(targetPriceAt(targetPrice, expectedGrowthRate, t)),
      };
    }
  }
  const required = requiredCapitalAt(targetPrice, expectedGrowthRate, ltv, acquisitionTaxRate, maxMonths);
  return {
    dDayMonths: null,
    requiredCapital: Math.round(required),
    availableAsset: Math.round(assetAt(initial, monthlySaving, maxMonths, monthlyReturnRate)),
    targetPriceAtPurchase: Math.round(targetPriceAt(targetPrice, expectedGrowthRate, maxMonths)),
  };
}
