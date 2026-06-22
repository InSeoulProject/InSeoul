"""InSeoul 내부 AI API (FastAPI) — 가이드 8-2.

- BE만 호출하는 /internal/ai/* 표면. FE 직접 호출 금지.
- stateless 유지, DB 직접 접근 금지.
- 외부 LLM 미설정/실패 시 항상 fallback 응답을 반환(데모 안정성, 가이드 16장).
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="InSeoul Internal AI API", version="0.1.0")

# 외부 LLM 키가 있으면 실제 호출(후속 구현), 없으면 fallback 모드.
LLM_AVAILABLE = bool(os.getenv("OPENAI_API_KEY"))
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")


# ───────── 스키마 (packages/shared-contracts 의 ai.ts 와 일치) ─────────

class ParseInputRequest(BaseModel):
    text: str


class ParsedFinancialInput(BaseModel):
    monthlyIncome: int | None = None
    monthlySavings: int | None = None
    currentAssets: int | None = None
    targetDistrict: str | None = None


class ParseInputResponse(BaseModel):
    parsed: ParsedFinancialInput
    isFallback: bool


class StrategyCardRequest(BaseModel):
    dDay: int
    targetAmount: int
    monthlySavings: int
    targetDistrict: str | None = None


class StrategyCard(BaseModel):
    title: str
    summary: str
    steps: list[str]
    isFallback: bool


class StrategyCardResponse(BaseModel):
    card: StrategyCard


class PolicyExplainRequest(BaseModel):
    loanProductCode: str
    eligible: bool


class PolicyExplainResponse(BaseModel):
    explanation: str
    isFallback: bool


class HealthResponse(BaseModel):
    status: str
    llmAvailable: bool


# ───────── 엔드포인트 ─────────

@app.get("/internal/ai/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok" if LLM_AVAILABLE else "degraded", llmAvailable=LLM_AVAILABLE)


@app.post("/internal/ai/parse-input", response_model=ParseInputResponse)
def parse_input(req: ParseInputRequest) -> ParseInputResponse:
    # TODO: LLM_AVAILABLE 시 실제 파싱. 현재는 fallback(빈 구조).
    return ParseInputResponse(parsed=ParsedFinancialInput(), isFallback=True)


@app.post("/internal/ai/strategy-card", response_model=StrategyCardResponse)
def strategy_card(req: StrategyCardRequest) -> StrategyCardResponse:
    # fallback: 입력만으로 구성한 기본 전략 카드.
    card = StrategyCard(
        title="기본 전략 카드",
        summary=(
            f"목표까지 D-{req.dDay}. 월 {req.monthlySavings:,}원 저축으로 "
            f"{req.targetAmount:,}원을 모으는 계획입니다."
        ),
        steps=[
            "월 저축액을 자동이체로 고정하세요.",
            "정책대출 자격을 확인하세요.",
            "분기마다 목표를 재점검하세요.",
        ],
        isFallback=True,
    )
    return StrategyCardResponse(card=card)


@app.post("/internal/ai/policy-explain", response_model=PolicyExplainResponse)
def policy_explain(req: PolicyExplainRequest) -> PolicyExplainResponse:
    verdict = "대상에 해당합니다." if req.eligible else "현재 조건으로는 대상이 아닙니다."
    return PolicyExplainResponse(
        explanation=f"{req.loanProductCode}: {verdict}",
        isFallback=True,
    )
