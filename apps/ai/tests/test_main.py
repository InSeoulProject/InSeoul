from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/internal/ai/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "llmAvailable" in body


def test_parse_input_fallback():
    r = client.post("/internal/ai/parse-input", json={"text": "월 100만원 저축, 마포구"})
    assert r.status_code == 200
    body = r.json()
    assert "missingFields" in body
    assert body["confidence"] == 0.0


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


def test_policy_explain():
    r = client.post(
        "/internal/ai/policy-explain",
        json={"loanName": "보금자리론", "status": "POSSIBLE"},
    )
    assert r.status_code == 200
    assert r.json()["isFallback"] is True
