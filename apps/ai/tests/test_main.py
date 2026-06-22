from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/internal/ai/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "llmAvailable" in body


def test_parse_input_rule_based_spec_example():
    # API 설계서 10-3 예시 — 룰기반 fallback이 핵심 필드를 추출해야 한다.
    r = client.post(
        "/internal/ai/parse-input",
        json={
            "text": (
                "전세 보증금 2억 있고 현금은 3천 있어. "
                "월 150 저축 가능하고 마포구를 보고 있어."
            ),
            "locale": "ko-KR",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["cashAsset"] == 30000000
    assert body["jeonseDeposit"] == 200000000
    assert body["monthlySaving"] == 1500000
    assert body["targetDistrict"] == "마포구"
    assert body["annualIncome"] is None
    assert body["targetPrice"] is None
    assert set(body["missingFields"]) == {"annualIncome", "firstHomeBuyer", "targetPrice"}
    assert body["confidence"] > 0.5


def test_parse_input_empty_is_fallback_zero():
    # 추출 불가 입력은 confidence 0.0, 핵심 필드 missing.
    r = client.post("/internal/ai/parse-input", json={"text": "안녕하세요"})
    assert r.status_code == 200
    body = r.json()
    assert body["confidence"] == 0.0
    assert "cashAsset" in body["missingFields"]


def test_parse_input_partial():
    r = client.post("/internal/ai/parse-input", json={"text": "월 100만원 저축, 강남구"})
    assert r.status_code == 200
    body = r.json()
    assert body["monthlySaving"] == 1000000
    assert body["targetDistrict"] == "강남구"
    assert body["confidence"] > 0.0


def test_normalize_district_whitelist():
    from app.main import _normalize_district

    assert _normalize_district("마포구") == "마포구"
    assert _normalize_district("마포") == "마포구"
    assert _normalize_district("서울 강남구 쪽") == "강남구"
    # 중구의 1글자 어간("중")이 중랑구를 가로채지 않아야 한다.
    assert _normalize_district("서울 중랑구 쪽") == "중랑구"
    assert _normalize_district("서울 서부") is None
    assert _normalize_district("") is None


def test_merge_parse_confidence_and_first_home():
    from app.main import _merge_parse
    from app.parsing import parse_korean_input

    text = "전세 보증금 2억 있고 현금은 3천 있어. 월 150 저축 가능하고 마포구. 생애최초야."
    rule = parse_korean_input(text)
    # LLM이 동일 4필드를 줬다고 가정 → confidence가 룰기반(0.86)과 동일해야 한다.
    llm_like = {
        "cashAsset": 30000000, "jeonseDeposit": 200000000,
        "monthlySaving": 1500000, "annualIncome": None,
        "targetDistrict": "마포구", "targetPrice": None,
    }
    merged = _merge_parse(llm_like, rule)
    assert merged["confidence"] == 0.86
    # 생애최초 감지 → firstHomeBuyer는 missing이 아니어야 한다.
    assert "firstHomeBuyer" not in merged["missingFields"]


def test_strategy_card():
    r = client.post(
        "/internal/ai/strategy-card",
        json={
            "simulationResult": {
                "dDayMonths": 36,
                "requiredCapital": 285000000,
                "targetDistrict": "마포구",
            },
            "stressTestResults": [{"scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5}],
            "loanResults": [],
            "guardrail": {"forbidGuarantee": True, "includeDisclaimer": True},
        },
    )
    assert r.status_code == 200
    card = r.json()
    assert "마포구" in card["summary"]
    assert len(card["actionItems"]) > 0
    assert card["disclaimer"]


def test_strategy_card_uses_loan_and_stress():
    # fallback이 정책대출명과 스트레스 시나리오를 actionItems에 반영해야 한다.
    r = client.post(
        "/internal/ai/strategy-card",
        json={
            "simulationResult": {
                "dDayMonths": 36, "requiredCapital": 285000000, "targetDistrict": "마포구",
            },
            "stressTestResults": [{"scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5}],
            "loanResults": [
                {"loanName": "보금자리론", "status": "POSSIBLE", "reason": "소득 조건 충족 가능"},
            ],
            "guardrail": {"forbidGuarantee": True, "includeDisclaimer": True},
        },
    )
    card = r.json()
    joined = " ".join(card["actionItems"])
    assert "보금자리론" in joined
    assert "5개월" in joined
    assert card["riskNotes"]
    # 어떤 출력에도 보장/단정 표현이 없어야 한다(NFR-04).
    from app.guardrail import violates
    assert not violates(card["summary"])
    assert all(not violates(x) for x in card["actionItems"])


def test_strategy_card_stress_not_dropped_with_many_loans():
    # loanResults가 많아도 스트레스 시나리오가 actionItems에 반영되어야 한다.
    r = client.post(
        "/internal/ai/strategy-card",
        json={
            "simulationResult": {
                "dDayMonths": 36, "requiredCapital": 285000000, "targetDistrict": "마포구",
            },
            "stressTestResults": [{"scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5}],
            "loanResults": [
                {"loanName": "보금자리론", "status": "POSSIBLE", "reason": "x"},
                {"loanName": "디딤돌", "status": "POSSIBLE", "reason": "x"},
                {"loanName": "특례", "status": "POSSIBLE", "reason": "x"},
            ],
            "guardrail": {"forbidGuarantee": True, "includeDisclaimer": True},
        },
    )
    card = r.json()
    assert any("지연" in x for x in card["actionItems"])


def test_strategy_card_disclaimer_flag_off():
    r = client.post(
        "/internal/ai/strategy-card",
        json={
            "simulationResult": {
                "dDayMonths": 12, "requiredCapital": 100000000, "targetDistrict": "강남구",
            },
            "stressTestResults": [],
            "loanResults": [],
            "guardrail": {"forbidGuarantee": True, "includeDisclaimer": False},
        },
    )
    assert r.status_code == 200
    assert r.json()["disclaimer"] == ""


def test_policy_explain():
    r = client.post(
        "/internal/ai/policy-explain",
        json={"loanName": "보금자리론", "status": "POSSIBLE"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["isFallback"] is True
    assert "보금자리론" in body["explanation"]


def test_policy_explain_with_product():
    # product 한도가 explanation에 결합되어야 한다.
    r = client.post(
        "/internal/ai/policy-explain",
        json={
            "loanName": "보금자리론",
            "status": "POSSIBLE",
            "product": {"maxHousePrice": 900000000, "maxIncome": 70000000, "ltv": 0.7},
        },
    )
    assert r.status_code == 200
    body = r.json()
    expl = body["explanation"]
    assert "9억원" in expl
    assert "7,000만원" in expl
    assert "70%" in expl
    from app.guardrail import violates
    assert not violates(expl)


def test_format_won():
    from app.main import _format_won

    assert _format_won(900000000) == "9억원"
    assert _format_won(60000000) == "6,000만원"
    assert _format_won(285000000) == "2억8,500만원"


# ───────── NSLPRJCT-26: fallback 방어막 ─────────

_STRATEGY_PAYLOAD = {
    "simulationResult": {
        "dDayMonths": 36, "requiredCapital": 285000000, "targetDistrict": "마포구",
    },
    "stressTestResults": [{"scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5}],
    "loanResults": [],
    "guardrail": {"forbidGuarantee": True, "includeDisclaimer": True},
}


def _force_llm_boom(monkeypatch):
    # LLM 사용 가능 상태에서 호출이 예외를 던지도록 강제.
    monkeypatch.setattr("app.main.llm.llm_available", lambda: True)

    def _boom(*a, **k):
        raise RuntimeError("LLM down")

    monkeypatch.setattr("app.main.llm.complete_json", _boom)


def test_parse_input_falls_back_on_llm_exception(monkeypatch):
    _force_llm_boom(monkeypatch)
    r = client.post(
        "/internal/ai/parse-input",
        json={"text": "현금 3천 있고 마포구 보고 있어"},
    )
    assert r.status_code == 200  # 500이 아니라 룰기반 fallback
    body = r.json()
    assert body["cashAsset"] == 30000000
    assert body["targetDistrict"] == "마포구"


def test_strategy_card_falls_back_on_llm_exception(monkeypatch):
    _force_llm_boom(monkeypatch)
    r = client.post("/internal/ai/strategy-card", json=_STRATEGY_PAYLOAD)
    assert r.status_code == 200
    card = r.json()
    assert "마포구" in card["summary"]
    assert card["disclaimer"]


def test_policy_explain_falls_back_on_llm_exception(monkeypatch):
    _force_llm_boom(monkeypatch)
    r = client.post(
        "/internal/ai/policy-explain",
        json={"loanName": "보금자리론", "status": "POSSIBLE"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["isFallback"] is True
    assert "보금자리론" in body["explanation"]


def test_strategy_card_falls_back_on_guardrail_violation(monkeypatch):
    # LLM이 보장 표현을 반환하면(정제 후에도 위반) fallback으로 가야 한다.
    monkeypatch.setattr("app.main.llm.llm_available", lambda: True)
    monkeypatch.setattr(
        "app.main.llm.complete_json",
        lambda *a, **k: {
            "summary": "마포구 매수를 100% 보장합니다",
            "actionItems": ["무조건 지금 사세요", "반드시 오릅니다"],
            "riskNotes": ["원금 손실 없음"],
        },
    )
    r = client.post("/internal/ai/strategy-card", json=_STRATEGY_PAYLOAD)
    assert r.status_code == 200
    card = r.json()
    from app.guardrail import violates
    # 결정론적 fallback이 쓰여 보장/단정 표현이 없어야 한다.
    assert not violates(card["summary"])
    assert all(not violates(x) for x in card["actionItems"])
    assert "100%" not in card["summary"]
