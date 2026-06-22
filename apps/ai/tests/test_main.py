from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/internal/ai/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "llmAvailable" in body


def test_strategy_card_fallback():
    r = client.post(
        "/internal/ai/strategy-card",
        json={"dDay": 365, "targetAmount": 100000000, "monthlySavings": 1000000},
    )
    assert r.status_code == 200
    card = r.json()["card"]
    assert card["isFallback"] is True
    assert len(card["steps"]) > 0


def test_parse_input_fallback():
    r = client.post("/internal/ai/parse-input", json={"text": "월 100만원 저축"})
    assert r.status_code == 200
    assert r.json()["isFallback"] is True
