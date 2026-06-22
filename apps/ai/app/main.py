"""InSeoul 내부 AI API (FastAPI) — API 설계서 10-3.

- BE만 호출하는 /internal/ai/*. FE 직접 호출 금지(NFR-12). stateless, DB 미저장(FR-18).
- 매수 확정/수익 보장/대출 승인 보장 표현 금지(NFR-04).
- 외부 LLM 미설정/실패 시 항상 fallback 응답(NFR-06).
- 필드/응답은 packages/shared-contracts 의 ai.ts 와 일치.
"""

from __future__ import annotations

import re

from fastapi import FastAPI
from pydantic import BaseModel

from app import guardrail, llm
from app.parsing import (
    CORE_AMOUNT_FIELDS,
    EXPECTED_FIELDS,
    SEOUL_DISTRICTS,
    parse_korean_input,
    to_won,
)

app = FastAPI(title="InSeoul Internal AI API", version="0.1.0")

AI_MODEL = llm.AI_MODEL

DISCLAIMER = guardrail.DISCLAIMER


def _try_llm(fn, *args):
    """LLM 경로 방어막(NFR-06) — 미설정/네트워크/파싱/가드레일 등 모든 예외를
    흡수해 None을 반환한다. 호출부는 None이면 결정론적 fallback으로 분기한다.
    """
    if not llm.llm_available():
        return None
    try:
        return fn(*args)
    except Exception:
        return None


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


class LoanProduct(BaseModel):
    maxHousePrice: int
    maxIncome: int
    ltv: float


class InternalPolicyExplainRequest(BaseModel):
    loanName: str
    status: str
    product: LoanProduct | None = None


class InternalPolicyExplainResponse(BaseModel):
    explanation: str
    isFallback: bool


class HealthResponse(BaseModel):
    status: str
    llmAvailable: bool


# ───────── 엔드포인트 ─────────

@app.get("/internal/ai/health", response_model=HealthResponse)
def health() -> HealthResponse:
    available = llm.llm_available()
    return HealthResponse(status="ok" if available else "degraded", llmAvailable=available)


_PARSE_FIELDS = [
    "cashAsset", "jeonseDeposit", "monthlySaving",
    "annualIncome", "targetDistrict", "targetPrice",
]

_PARSE_SYSTEM = (
    "너는 한국어 부동산/금융 자연어를 구조화하는 추출기다. "
    "주어진 문장에서 다음 필드를 JSON으로만 추출하라(설명·코드펜스 금지): "
    "cashAsset(현금, 원), jeonseDeposit(전세보증금, 원), monthlySaving(월 저축액, 원), "
    "annualIncome(연소득, 원), targetDistrict(서울 자치구명 문자열), targetPrice(목표 집값, 원). "
    "금액은 원 단위 정수로 환산한다(예: '3천'=30000000, '월 150'=1500000, '2억'=200000000). "
    "없는 값은 null. 추정/보장 표현 금지. JSON 객체 하나만 출력."
)


def _coerce_won(value: object) -> int | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int | float):
        return int(value) if value > 0 else None
    if isinstance(value, str):
        # LLM이 숫자를 문자열("30000000")이나 한국어("3억")로 줄 수 있다.
        if re.search(r"[억천백만]", value):
            return to_won(value) or None
        digits = re.sub(r"[^\d]", "", value)
        return int(digits) or None if digits else None
    return None


def _normalize_district(value: object) -> str | None:
    """LLM 자치구 값을 서울 25개 구 화이트리스트로 검증/보정. 비계약 값은 None."""
    if not isinstance(value, str) or not value.strip():
        return None
    if value in SEOUL_DISTRICTS:
        return value
    # 1) 전체 구명 부분일치 우선("서울 중랑구 쪽" → 중랑구). 긴 이름부터 검사.
    for d in sorted(SEOUL_DISTRICTS, key=len, reverse=True):
        if d in value:
            return d
    # 2) '구' 없는 어간 일치("마포" → 마포구). 1글자 어간(예: 중구→"중")은 오탐 위험 제외.
    for d in sorted(SEOUL_DISTRICTS, key=len, reverse=True):
        stem = d[:-1]
        if len(stem) >= 2 and stem in value:
            return d
    return None


def _llm_parse(text: str, locale: str | None) -> dict | None:
    """LLM 추출 시도 → 정규화 dict. 실패/빈 결과 시 None."""
    raw = llm.complete_json(_PARSE_SYSTEM, f"locale={locale or 'ko-KR'}\n문장: {text}")
    if not raw:
        return None
    parsed: dict = {f: None for f in _PARSE_FIELDS}
    for f in ("cashAsset", "jeonseDeposit", "monthlySaving", "annualIncome", "targetPrice"):
        parsed[f] = _coerce_won(raw.get(f))
    parsed["targetDistrict"] = _normalize_district(raw.get("targetDistrict"))
    if all(parsed[f] is None for f in _PARSE_FIELDS):
        return None  # 아무것도 못 뽑았으면 룰기반에 위임
    return parsed


def _confidence(extracted: int) -> float:
    # 룰기반·병합 공통 — 설계서 10-3 예시(핵심 4필드 → 0.86)와 일치.
    return round(min(0.95, 0.5 + 0.09 * extracted), 2) if extracted else 0.0


def _merge_parse(primary: dict, fallback: dict) -> dict:
    """LLM 결과를 우선하되 null 필드는 룰기반으로 보강."""
    merged = {
        f: (primary.get(f) if primary.get(f) is not None else fallback.get(f))
        for f in _PARSE_FIELDS
    }
    present = {f for f in EXPECTED_FIELDS if merged.get(f) is not None}
    # firstHomeBuyer는 응답 스키마 밖이라 룰기반(fallback)의 감지 결과를 승계한다.
    if "firstHomeBuyer" not in fallback.get("missingFields", []):
        present.add("firstHomeBuyer")
    merged["missingFields"] = [f for f in EXPECTED_FIELDS if f not in present]
    extracted = sum(1 for f in CORE_AMOUNT_FIELDS if merged.get(f) is not None)
    if merged.get("targetDistrict") is not None:
        extracted += 1
    merged["confidence"] = _confidence(extracted)
    return merged


@app.post("/internal/ai/parse-input", response_model=InternalParseInputResponse)
def parse_input(req: InternalParseInputRequest) -> InternalParseInputResponse:
    # 룰기반은 항상 계산(결정론적 fallback). LLM 가능 시 우선 적용 후 null 보강.
    rule = parse_korean_input(req.text)
    llm_result = _try_llm(_llm_parse, req.text, req.locale)
    data = _merge_parse(llm_result, rule) if llm_result else rule
    return InternalParseInputResponse(**data)


_STRATEGY_SYSTEM = (
    "너는 한국 부동산 자산 전략 코치다. 주어진 시뮬레이션/스트레스/정책대출 결과를 바탕으로 "
    "사용자가 이해하기 쉬운 전략 카드를 한국어로 작성한다. "
    "반드시 JSON 객체 하나만 출력(설명·코드펜스 금지): "
    '{"summary": "...", "actionItems": ["..."], "riskNotes": ["..."]}. '
    "summary는 1문장, actionItems 2~4개(실행 가능한 조언), riskNotes 1~3개(주의/리스크). "
    "절대 금지: 매수 확정, 수익 보장, 대출 승인 보장, '무조건/반드시/100%' 같은 단정 표현. "
    "모든 표현은 '가능성/예상/검토' 등 확률적·권고적 어조로."
)

_DEFAULT_RISK_NOTE = (
    "본 결과는 입력값 기반 시뮬레이션이며 실제 대출 승인이나 매수를 보장하지 않습니다."
)

_STRESS_LABEL = {
    "INTEREST_RATE_UP": "금리 상승",
    "PRICE_UP": "집값 상승",
    "INCOME_DOWN": "소득 감소",
}
_LOAN_ACTION = {
    "POSSIBLE": "{name} 주택 가격 한도 확인이 필요합니다.",
    "NEED_MORE_INFO": "{name} 자격 요건을 추가로 확인하세요.",
    "IMPOSSIBLE": "{name}은 현재 조건에서 어려워 다른 정책대출을 검토하세요.",
}


def _assemble_action_items(*sections: list[str], cap: int = 4) -> list[str]:
    """섹션별 최소 1개를 먼저 보장한 뒤 남는 자리를 채운다(스트레스 누락 방지)."""
    items: list[str] = []
    for sec in sections:  # 1라운드: 각 섹션 첫 항목
        if sec and len(items) < cap:
            items.append(sec[0])
    for sec in sections:  # 2라운드: 나머지 항목으로 채움
        for x in sec[1:]:
            if len(items) < cap:
                items.append(x)
    return items


def _fallback_strategy_card(req: InternalStrategyCardRequest) -> dict:
    """LLM 미가용/실패/가드레일 위반 시 결정론적 전략 카드(NFR-06)."""
    sim = req.simulationResult
    summary = (
        f"현재 조건에서는 {sim.targetDistrict} 매수 가능 시점이 "
        f"약 {sim.dDayMonths}개월 뒤입니다."
    )

    base = ["월 저축액을 늘리면 D-Day 단축 가능성이 있습니다."]
    loan_items = [
        _LOAN_ACTION[loan.status].format(name=loan.loanName)
        for loan in req.loanResults
        if loan.status in _LOAN_ACTION
    ]
    stress_items = [
        f"{_STRESS_LABEL.get(s.scenarioType, '시장 변동')} 시 매수 시점이 "
        f"약 {s.delayedMonths}개월 지연될 수 있습니다."
        for s in req.stressTestResults
    ]
    return {
        "summary": summary,
        "actionItems": _assemble_action_items(base, loan_items, stress_items),
        "riskNotes": [_DEFAULT_RISK_NOTE],
    }


def _llm_strategy_card(req: InternalStrategyCardRequest) -> dict | None:
    """LLM 전략 카드 시도 → 가드레일 정제. 실패/위반/형식오류 시 None."""
    sim = req.simulationResult
    stress = "; ".join(
        f"{_STRESS_LABEL.get(s.scenarioType, s.scenarioType)} {s.delayedMonths}개월 지연"
        for s in req.stressTestResults
    ) or "없음"
    loans = "; ".join(
        f"{loan.loanName}={loan.status}({loan.reason})" for loan in req.loanResults
    ) or "없음"
    user = (
        f"목표지역={sim.targetDistrict}, D-Day={sim.dDayMonths}개월, "
        f"필요자본={sim.requiredCapital}원\n스트레스: {stress}\n정책대출: {loans}"
    )
    raw = llm.complete_json(_STRATEGY_SYSTEM, user, max_tokens=600)
    if not raw:
        return None

    summary = raw.get("summary")
    items = raw.get("actionItems")
    notes = raw.get("riskNotes")
    if not isinstance(summary, str) or not isinstance(items, list):
        return None

    if not isinstance(notes, list):
        return None  # riskNotes 누락/타입 오류 → 부분 응답으로 보고 fallback(NFR-06)

    summary = guardrail.sanitize(summary.strip())
    action_items = [
        guardrail.sanitize(x.strip()) for x in items if isinstance(x, str) and x.strip()
    ]
    risk_notes = [
        guardrail.sanitize(x.strip()) for x in notes if isinstance(x, str) and x.strip()
    ]
    # 시스템 프롬프트 계약(actionItems 2~4, riskNotes 1~3) 미충족 시 fallback.
    if not summary or len(action_items) < 2 or not risk_notes:
        return None

    # 정제 후에도 단정/보장 표현이 남으면 위반 → fallback에 위임.
    if any(guardrail.violates(t) for t in [summary, *action_items, *risk_notes]):
        return None

    return {"summary": summary, "actionItems": action_items[:4], "riskNotes": risk_notes[:3]}


@app.post("/internal/ai/strategy-card", response_model=StrategyCard)
def strategy_card(req: InternalStrategyCardRequest) -> StrategyCard:
    card = _try_llm(_llm_strategy_card, req) or _fallback_strategy_card(req)
    disclaimer = DISCLAIMER if req.guardrail.includeDisclaimer else ""
    return StrategyCard(
        summary=card["summary"],
        actionItems=card["actionItems"],
        riskNotes=card["riskNotes"],
        disclaimer=disclaimer,
    )


_POLICY_VERDICT = {
    "POSSIBLE": "대상에 해당할 가능성이 있습니다.",
    "IMPOSSIBLE": "현재 조건으로는 대상이 아닐 수 있습니다.",
    "NEED_MORE_INFO": "추가 정보 확인이 필요합니다.",
}

_POLICY_SYSTEM = (
    "너는 한국 정책대출 안내원이다. 주어진 대출명·판정상태·상품 한도를 바탕으로 "
    "사용자가 이해하기 쉽게 2~3문장으로 설명한다. 반드시 JSON 객체 하나만 출력"
    '(설명·코드펜스 금지): {"explanation": "..."}. '
    "금지: 대출 승인 보장, 무조건/반드시/확실 같은 단정 표현. '가능성/검토 필요' 어조로."
)


def _format_won(won: int) -> str:
    """원 단위 정수를 '9억', '6천만원' 같은 한국어 금액으로."""
    eok, man = divmod(won, 100_000_000)
    parts = []
    if eok:
        parts.append(f"{eok}억")
    man //= 10_000
    if man:
        parts.append(f"{man:,}만")
    return ("".join(parts) or "0") + "원"


def _policy_product_note(p: LoanProduct) -> str:
    return (
        f" 주택 가격 한도는 {_format_won(p.maxHousePrice)}, 소득 한도는 "
        f"{_format_won(p.maxIncome)}, 최대 LTV는 {round(p.ltv * 100)}%입니다."
    )


def _fallback_policy_explain(req: InternalPolicyExplainRequest) -> str:
    verdict = _POLICY_VERDICT.get(req.status, "조건 확인이 필요합니다.")
    note = _policy_product_note(req.product) if req.product else ""
    return f"{req.loanName}: {verdict}{note}"


def _llm_policy_explain(req: InternalPolicyExplainRequest) -> str | None:
    product = _policy_product_note(req.product).strip() if req.product else "한도 정보 없음"
    user = f"대출명={req.loanName}, 판정상태={req.status}\n상품 한도: {product}"
    raw = llm.complete_json(_POLICY_SYSTEM, user, max_tokens=300)
    if not raw:
        return None
    explanation = raw.get("explanation")
    if not isinstance(explanation, str) or not explanation.strip():
        return None
    explanation = guardrail.sanitize(explanation.strip())
    if guardrail.violates(explanation):
        return None  # 단정/보장 표현 → fallback
    return explanation


@app.post("/internal/ai/policy-explain", response_model=InternalPolicyExplainResponse)
def policy_explain(req: InternalPolicyExplainRequest) -> InternalPolicyExplainResponse:
    explanation = _try_llm(_llm_policy_explain, req)
    if explanation is not None:
        return InternalPolicyExplainResponse(explanation=explanation, isFallback=False)
    return InternalPolicyExplainResponse(
        explanation=_fallback_policy_explain(req),
        isFallback=True,
    )
