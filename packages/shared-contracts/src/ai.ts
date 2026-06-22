/**
 * AI 계약 — 외부(FE→BE)와 내부(BE→AI)를 분리한다.
 *
 * 외부: /api/ai/*           — FE가 BE를 통해 호출. BE가 인증·저장 후 AI로 중계.
 * 내부: /internal/ai/*      — BE만 호출. FE는 절대 직접 호출 금지. AI는 stateless, DB 접근 금지.
 *
 * 모든 AI 응답은 fallback(데모 안정성)을 가질 수 있다.
 */
import type { Won } from "./common.js";

/* ───────── 공통 도메인 ───────── */

export interface ParsedFinancialInput {
  monthlyIncome?: Won;
  monthlySavings?: Won;
  currentAssets?: Won;
  targetDistrict?: string;
}

export interface StrategyCard {
  title: string;
  summary: string;
  /** 실행 단계. */
  steps: string[];
  /** AI fallback 응답인지 여부 (데모 안정성). */
  isFallback: boolean;
}

/* ───────── 외부 API: /api/ai/* (FE ↔ BE) ───────── */

/** POST /api/ai/parse-input */
export interface ParseInputRequest {
  text: string;
}
export interface ParseInputResponse {
  parsed: ParsedFinancialInput;
}

/** POST /api/ai/strategy-card — 생성 및 저장 (BE가 simulationId 소유권 검증) */
export interface StrategyCardRequest {
  simulationId: string;
}
export interface StrategyCardResponse {
  cardId: string;
  card: StrategyCard;
}

/* ───────── 내부 API: /internal/ai/* (BE → AI only) ───────── */

/** POST /internal/ai/parse-input */
export interface InternalParseInputRequest {
  text: string;
}
export interface InternalParseInputResponse {
  parsed: ParsedFinancialInput;
  isFallback: boolean;
}

/** POST /internal/ai/strategy-card — 계산 결과 → 전략 카드 (AI는 저장하지 않음) */
export interface InternalStrategyCardRequest {
  dDay: number;
  targetAmount: Won;
  monthlySavings: Won;
  targetDistrict?: string;
}
export interface InternalStrategyCardResponse {
  card: StrategyCard;
}

/** POST /internal/ai/policy-explain */
export interface InternalPolicyExplainRequest {
  loanProductCode: string;
  eligible: boolean;
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
