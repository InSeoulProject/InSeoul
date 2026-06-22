/** 시뮬레이션 — 가이드 8-1: /api/simulation/*, /api/districts/prices */
import type { UserId, Won, IsoDate, IsoDateTime } from "./common.js";

/** GET /api/districts/prices */
export interface DistrictPrice {
  districtCode: string;
  districtName: string;
  /** 대표 가격(원). */
  price: Won;
  asOf: IsoDate;
}
export interface DistrictPricesResponse {
  prices: DistrictPrice[];
}

/** POST /api/simulation/golden-cross — D-Day 계산 및 저장 */
export interface GoldenCrossRequest {
  targetDistrictCode: string;
  monthlySavings: Won;
  currentAssets: Won;
}
export interface GoldenCrossResponse {
  simulationId: string;
  userId: UserId;
  /** 목표 달성까지 남은 일수. */
  dDay: number;
  targetAmount: Won;
  /** 예상 달성일. */
  achieveDate: IsoDate;
  createdAt: IsoDateTime;
}

/** POST /api/simulation/stress-test — 리스크 계산 */
export interface StressTestRequest {
  simulationId: string;
  /** 시나리오: 금리 인상폭(%), 소득 변화율(%) 등. */
  interestRateDeltaPct?: number;
  incomeChangePct?: number;
}
export interface StressTestResponse {
  simulationId: string;
  /** 시나리오 적용 후 변동된 D-Day. */
  adjustedDDay: number;
  riskLevel: "low" | "medium" | "high";
  notes: string;
}

/** GET /api/simulation/history — 로그인 사용자 본인 데이터만 */
export interface SimulationHistoryItem {
  simulationId: string;
  dDay: number;
  targetAmount: Won;
  createdAt: IsoDateTime;
}
export interface SimulationHistoryResponse {
  items: SimulationHistoryItem[];
}
