/** 정책대출 — API 설계서: /api/loans/eligibility (보금자리론/디딤돌 등) */
import type { Won } from "./common.js";

export interface LoanProduct {
  name: string;
  maxHousePrice: Won;
  maxIncome: Won;
  ltv: number;
  description: string;
}

export type LoanStatus = "POSSIBLE" | "IMPOSSIBLE" | "NEED_MORE_INFO";

/** POST /api/loans/eligibility */
export interface LoanEligibilityRequest {
  annualIncome: Won;
  targetPrice: Won;
  firstHomeBuyer?: boolean;
  maritalStatus?: "single" | "married";
}

export interface LoanEligibilityResult {
  loanName: string;
  status: LoanStatus;
  reason: string;
}
export interface LoanEligibilityData {
  results: LoanEligibilityResult[];
}
