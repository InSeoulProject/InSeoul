/** 시뮬레이션 — API 설계서 5·7·8장: districts/prices, golden-cross, stress-test, history */
import type { Id, Won, IsoDate, IsoDateTime } from "./common.js";

/** GET /api/districts/prices */
export interface DistrictPrice {
  district: string;
  averagePrice: Won;
  jeonsePrice: Won;
  baseDate: IsoDate;
}
export type DistrictPricesData = DistrictPrice[];

/** POST /api/simulation/golden-cross — 매수 D-Day 계산 및 저장 */
export interface GoldenCrossRequest {
  cashAsset: Won;
  jeonseDeposit: Won;
  monthlySaving: Won;
  targetDistrict: string;
  targetPrice: Won;
  /** 대출 가능 비율 (예: 0.7) */
  ltv: number;
  /** 연 금리 (예: 0.04) */
  interestRate: number;
  /** 연간 주택가격 상승률 (예: 0.03) */
  expectedGrowthRate: number;
  /** 취득세율 (예: 0.011) */
  acquisitionTaxRate: number;
}
export interface GoldenCrossData {
  simulationId: Id;
  dDayMonths: number;
  requiredCapital: Won;
  availableAsset: Won;
  targetPriceAtPurchase: Won;
  message: string;
}

/** 스트레스 테스트 시나리오 유형 */
export type ScenarioType =
  | "INTEREST_RATE_UP"
  | "PRICE_UP"
  | "SAVING_DOWN"
  | "SAVING_UP";

/** POST /api/simulation/stress-test */
export interface StressTestRequest {
  simulationId: Id;
  /** 적용할 시나리오들 (생략 시 기본 세트) */
  scenarios?: ScenarioType[];
}
export interface StressTestResult {
  scenarioType: ScenarioType;
  /** 시나리오 변동값 (예: 금리 +0.01) */
  changedValue?: number;
  /** 기준 대비 지연(+)/단축(-) 개월 */
  delayedMonths: number;
  /** 시나리오 적용 후 D-Day */
  resultDDayMonths: number;
}
export interface StressTestData {
  results: StressTestResult[];
}

/** GET /api/simulation/history — 로그인 사용자 본인 데이터만 */
export interface SimulationHistoryItem {
  simulationId: Id;
  targetDistrict: string;
  dDayMonths: number;
  createdAt: IsoDateTime;
}
export type SimulationHistoryData = SimulationHistoryItem[];
