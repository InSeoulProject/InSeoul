/** 정책대출 — 가이드 8-1: /api/loans/eligibility */
import type { Won } from "./common.js";

export interface LoanProduct {
  code: string;
  name: string;
  /** 연 이자율(%). */
  interestRatePct: number;
  /** 최대 한도(원). */
  maxAmount: Won;
}

/** POST /api/loans/eligibility — 정책대출 판정 */
export interface LoanEligibilityRequest {
  annualIncome: Won;
  currentAssets: Won;
  /** 무주택 여부 등 조건 플래그. */
  isFirstHome?: boolean;
}

export interface LoanEligibilityResult {
  product: LoanProduct;
  eligible: boolean;
  /** 판정 사유 (정책 설명용). */
  reason: string;
  approvedAmount?: Won;
}

export interface LoanEligibilityResponse {
  results: LoanEligibilityResult[];
}
