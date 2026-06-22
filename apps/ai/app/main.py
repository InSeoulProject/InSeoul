"""InSeoul 내부 AI API (FastAPI) — API 설계서 10-3.

- BE만 호출하는 /internal/ai/*. FE 직접 호출 금지(NFR-12). stateless, DB 미저장(FR-18).
- 매수 확정/수익 보장/대출 승인 보장 표현 금지(NFR-04).
- 외부 LLM 미설정/실패 시 항상 fallback 응답(NFR-06).
- 필드/응답은 packages/shared-contracts 의 ai.ts 와 일치.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="InSeoul Internal AI API", version="0.1.0")

LLM_AVAILABLE = bool(os.getenv("OPENAI_API_KEY"))
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")

DISCLAIMER = "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다."


# ───────── 스키마 ─────────

class InternalParseInputRequest(BaseModel):
    text: str
    locale: str | None = "ko-KR"


class InternalParseInputResponse(BaseModel):
    cashAsset: int | None = None
    jeonseDeposit: int | None = None
    monthlySaving: int | None = None
    annualIncome: int | None = None
    targetDistrict: str | None = None
    targetPrice: int | None = None
    missingFields: list[str] = []
    confidence: float = 0.0


class SimulationResultRef(BaseModel):
    dDayMonths: int
    requiredCapital: int
    targetDistrict: str


class StressTestRef(BaseModel):
    scenarioType: str
    delayedMonths: int


class LoanResultRef(BaseModel):
    loanName: str
    status: str
    reason: str


class AiGuardrail(BaseModel):
    forbidGuarantee: bool = True
    includeDisclaimer: bool = True


class InternalStrategyCardRequest(BaseModel):
    simulationResult: SimulationResultRef
    stressTestResults: list[StressTestRef] = []
    loanResults: list[LoanResultRef] = []
    guardrail: AiGuardrail = AiGuardrail()


class StrategyCard(BaseModel):
    summary: str
    actionItems: list[str]
    riskNotes: list[str]
    disclaimer: str


class InternalPolicyExplainRequest(BaseModel):
    loanName: str
    status: str


class InternalPolicyExplainResponse(BaseModel):
    explanation: str
    isFallback: bool


class HealthResponse(BaseModel):
    status: str
    llmAvailable: bool


# ───────── 엔드포인트 ─────────

@app.get("/internal/ai/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok" if LLM_AVAILABLE else "degraded", llmAvailable=LLM_AVAILABLE)


@app.post("/internal/ai/parse-input", response_model=InternalParseInputResponse)
def parse_input(req: InternalParseInputRequest) -> InternalParseInputResponse:
    # TODO: LLM_AVAILABLE 시 Function Calling 파싱. 현재는 fallback(빈 구조).
    missing = [
        "cashAsset", "jeonseDeposit", "monthlySaving",
        "annualIncome", "targetDistrict", "targetPrice",
    ]
    return InternalParseInputResponse(missingFields=missing, confidence=0.0)


@app.post("/internal/ai/strategy-card", response_model=StrategyCard)
def strategy_card(req: InternalStrategyCardRequest) -> StrategyCard:
    sim = req.simulationResult
    summary = (
        f"현재 조건에서는 {sim.targetDistrict} 매수 가능 시점이 약 {sim.dDayMonths}개월 뒤입니다."
    )
    action_items = [
        "월 저축액을 늘리면 D-Day 단축 가능성이 있습니다.",
        "정책대출 주택 가격 한도를 확인하세요.",
    ]
    for s in req.stressTestResults:
        if s.scenarioType == "INTEREST_RATE_UP":
            action_items.append(
                f"금리 상승 시 매수 시점이 약 {s.delayedMonths}개월 지연될 수 있습니다."
            )
    risk_notes = [
        "본 결과는 입력값 기반 시뮬레이션이며 실제 대출 승인이나 매수를 보장하지 않습니다."
    ]
    return StrategyCard(
        summary=summary,
        actionItems=action_items[:3],
        riskNotes=risk_notes,
        disclaimer=DISCLAIMER,
    )


@app.post("/internal/ai/policy-explain", response_model=InternalPolicyExplainResponse)
def policy_explain(req: InternalPolicyExplainRequest) -> InternalPolicyExplainResponse:
    verdict = {
        "POSSIBLE": "대상에 해당할 가능성이 있습니다.",
        "IMPOSSIBLE": "현재 조건으로는 대상이 아닐 수 있습니다.",
        "NEED_MORE_INFO": "추가 정보 확인이 필요합니다.",
    }.get(req.status, "조건 확인이 필요합니다.")
    return InternalPolicyExplainResponse(
        explanation=f"{req.loanName}: {verdict}",
        isFallback=True,
    )
