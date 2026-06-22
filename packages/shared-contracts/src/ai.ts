/**
 * AI 계약 — API 설계서 6·9·10장. 외부(FE→BE)와 내부(BE→AI) 분리.
 * 외부: /api/ai/* (또는 /api/parse-input) — FE가 BE 통해 호출.
 * 내부: /internal/ai/* — BE만 호출. FE 직접 호출 금지(NFR-11/12). AI는 stateless, DB 미저장(FR-18).
 * AI는 매수 확정/수익 보장/대출 승인 보장 표현 금지(NFR-04). 실패 시 fallback(NFR-06).
 */
import type { Won } from "./common.js";
import type { ScenarioType } from "./simulation.js";
import type { LoanStatus } from "./loan.js";

/* ───────── 공통 도메인 ───────── */

export interface ParsedFinancialInput {
  cashAsset: Won | null;
  jeonseDeposit: Won | null;
  monthlySaving: Won | null;
  annualIncome: Won | null;
  targetDistrict: string | null;
  targetPrice: Won | null;
  /** 추출 못 한 필드 목록 (추가 질문 유도) */
  missingFields: string[];
}

export interface SimulationResultRef {
  dDayMonths: number;
  requiredCapital: Won;
  targetDistrict: string;
}
export interface StressTestRef {
  scenarioType: ScenarioType;
  delayedMonths: number;
}
export interface LoanResultRef {
  loanName: string;
  status: LoanStatus;
  reason: string;
}

export interface StrategyCard {
  summary: string;
  actionItems: string[];
  /** 리스크 안내 (내부 응답에 포함) */
  riskNotes?: string[];
  disclaimer: string;
}

/* ───────── 외부 API: /api/parse-input, /api/ai/* ───────── */

/** POST /api/parse-input (= /api/ai/parse-input) */
export interface ParseInputRequest {
  text: string;
}
export type ParseInputData = ParsedFinancialInput;

/** POST /api/ai/strategy-card — 생성 및 저장 (BE가 simulationId 소유권 검증) */
export interface StrategyCardRequest {
  simulationId: number;
  simulationResult: SimulationResultRef;
  stressTestResults: StressTestRef[];
  loanResults: LoanResultRef[];
}
export interface StrategyCardData {
  strategyCardId: number;
  summary: string;
  actionItems: string[];
  disclaimer: string;
}

/** POST /api/ai/policy-explain */
export interface PolicyExplainRequest {
  loanName: string;
  status: LoanStatus;
}
export interface PolicyExplainData {
  explanation: string;
}

/* ───────── 내부 API: /internal/ai/* (BE → AI only) ───────── */

export interface InternalParseInputRequest {
  text: string;
  locale?: string;
}
export interface InternalParseInputResponse extends ParsedFinancialInput {
  /** 추출 신뢰도 0~1 */
  confidence: number;
}

export interface AiGuardrail {
  forbidGuarantee: boolean;
  includeDisclaimer: boolean;
}
export interface InternalStrategyCardRequest {
  simulationResult: SimulationResultRef;
  stressTestResults: StressTestRef[];
  loanResults: LoanResultRef[];
  guardrail: AiGuardrail;
}
/** 전략 카드 본문 (BE가 저장 시 strategyCardId 부여) */
export type InternalStrategyCardResponse = StrategyCard;

export interface InternalPolicyExplainRequest {
  loanName: string;
  status: LoanStatus;
  product?: { maxHousePrice: Won; maxIncome: Won; ltv: number };
}
export interface InternalPolicyExplainResponse {
  explanation: string;
  isFallback: boolean;
}

/** GET /internal/ai/health */
export interface InternalHealthResponse {
  status: "ok" | "degraded";
  /** 외부 LLM 연결 가능 여부. false면 fallback 모드. */
  llmAvailable: boolean;
}
