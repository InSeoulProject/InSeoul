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

/**
 * 입력 검증 — 음수/비유한/범위 밖 값이면 RangeError. 동일 입력의 결정론을 위해
 * 계산 전에 비정상 입력을 차단한다(NFR-03 / 가비지-인 방지).
 */
export function validateGoldenCrossParams(params: GoldenCrossParams): void {
  const nonNeg: [string, number][] = [
    ["cashAsset", params.cashAsset],
    ["jeonseDeposit", params.jeonseDeposit],
    ["monthlySaving", params.monthlySaving],
  ];
  for (const [name, v] of nonNeg) {
    if (!Number.isFinite(v) || v < 0) {
      throw new RangeError(`${name}는 0 이상의 유한한 값이어야 합니다: ${v}`);
    }
  }
  if (!Number.isFinite(params.targetPrice) || params.targetPrice <= 0) {
    throw new RangeError(`targetPrice는 0보다 큰 값이어야 합니다: ${params.targetPrice}`);
  }
  if (!Number.isFinite(params.ltv) || params.ltv < 0 || params.ltv > 1) {
    throw new RangeError(`ltv는 0~1 범위여야 합니다: ${params.ltv}`);
  }
  if (!Number.isFinite(params.acquisitionTaxRate) || params.acquisitionTaxRate < 0) {
    throw new RangeError(`acquisitionTaxRate는 0 이상이어야 합니다: ${params.acquisitionTaxRate}`);
  }
  if (!Number.isFinite(params.expectedGrowthRate) || params.expectedGrowthRate <= -1) {
    throw new RangeError(`expectedGrowthRate는 -1 초과여야 합니다: ${params.expectedGrowthRate}`);
  }
  const r = params.monthlyReturnRate ?? 0;
  if (!Number.isFinite(r) || r <= -1) {
    throw new RangeError(`monthlyReturnRate는 -1 초과여야 합니다: ${r}`);
  }
  const m = params.maxMonths ?? 600;
  if (!Number.isInteger(m) || m < 0) {
    throw new RangeError(`maxMonths는 0 이상의 정수여야 합니다: ${m}`);
  }
}

/** 자산선 A(t) ≥ 필요 자기자본 P(t) 를 만족하는 최소 t(개월). */
export function goldenCross(params: GoldenCrossParams): GoldenCrossResult {
  validateGoldenCrossParams(params);
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

/* ───────── 스트레스 테스트 — 리스크 시나리오별 D-Day 변화 ───────── */

/** shared-contracts simulation.ts 의 ScenarioType 과 일치. */
export type ScenarioType =
  | "INTEREST_RATE_UP"
  | "PRICE_UP"
  | "SAVING_DOWN"
  | "SAVING_UP";

export interface StressScenario {
  scenarioType: ScenarioType;
  /** 시나리오 변동값(시나리오별 의미가 다름). 생략 시 기본 델타. */
  delta?: number;
}

export interface StressTestResult {
  scenarioType: ScenarioType;
  /** 적용된 변동값(예: 금리 +0.01, 상승률 +0.02, 월저축 -0.2) */
  changedValue: number;
  /** 시나리오 적용 후 D-Day(개월). 도달 불가 시 null */
  resultDDayMonths: number | null;
  /** 기준 대비 지연(+)/단축(-) 개월. 도달 불가 변화는 maxMonths 기준으로 환산 */
  delayedMonths: number;
}

/** 시나리오 기본 델타. */
export const DEFAULT_STRESS_DELTAS: Record<ScenarioType, number> = {
  INTEREST_RATE_UP: 0.01, // 금리 +1%p
  PRICE_UP: 0.02, // 연 상승률 +2%p
  SAVING_DOWN: -0.2, // 월 저축 -20%
  SAVING_UP: 0.2, // 월 저축 +20%
};

/** 기본 스트레스 시나리오 세트(델타 미지정 시 적용). */
export const DEFAULT_SCENARIOS: readonly ScenarioType[] = [
  "INTEREST_RATE_UP",
  "PRICE_UP",
  "SAVING_DOWN",
  "SAVING_UP",
];

// 금리 1%p 상승 → 가용 대출 한도 축소를 LTV 하락으로 근사(데모 가정).
// 본 모델은 자기자본 도달 시점을 계산하므로, 금리 영향을 유효 LTV 하락으로 반영한다.
const LTV_DROP_PER_RATE_POINT = 3; // +0.01(=1%p) → LTV -0.03

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 시나리오를 기준 파라미터에 적용해 변형된 파라미터를 만든다(원본 불변). */
export function applyScenario(base: GoldenCrossParams, scenario: StressScenario): GoldenCrossParams {
  const delta = scenario.delta ?? DEFAULT_STRESS_DELTAS[scenario.scenarioType];
  const next = { ...base };
  switch (scenario.scenarioType) {
    case "INTEREST_RATE_UP":
      next.ltv = clamp(base.ltv - delta * LTV_DROP_PER_RATE_POINT, 0, 1);
      break;
    case "PRICE_UP":
      next.expectedGrowthRate = base.expectedGrowthRate + delta;
      break;
    case "SAVING_DOWN":
    case "SAVING_UP":
      next.monthlySaving = Math.max(0, base.monthlySaving * (1 + delta));
      break;
  }
  return next;
}

/**
 * 기준 대비 각 시나리오의 D-Day 변화를 계산. 결정론적(NFR-03).
 * 도달 불가(null)는 비교 시 maxMonths 로 환산해 지연 개월을 정량화한다.
 */
export function stressTest(
  base: GoldenCrossParams,
  scenarios: readonly (ScenarioType | StressScenario)[] = DEFAULT_SCENARIOS,
): StressTestResult[] {
  validateGoldenCrossParams(base);
  const cap = base.maxMonths ?? 600;
  const baseline = goldenCross(base).dDayMonths ?? cap;

  return scenarios.map((s) => {
    const scenario: StressScenario = typeof s === "string" ? { scenarioType: s } : s;
    const result = goldenCross(applyScenario(base, scenario)).dDayMonths;
    const resultForDiff = result ?? cap;
    return {
      scenarioType: scenario.scenarioType,
      changedValue: scenario.delta ?? DEFAULT_STRESS_DELTAS[scenario.scenarioType],
      resultDDayMonths: result,
      delayedMonths: resultForDiff - baseline,
    };
  });
}
