"""가드레일 단위 테스트 — NFR-04(보장/단정 표현 금지)."""

import pytest

from app.guardrail import sanitize, violates


@pytest.mark.parametrize(
    "text",
    [
        "수익을 보장합니다",
        "대출 승인을 보장합니다",
        "원금을 보장합니다",
        "무조건 매수하세요",
        "반드시 오릅니다",
        "100% 가능합니다",
        "매수를 확정하세요",
        "수익이 확실합니다",
        "대출 승인 확실",
        "원금 손실 없음",
        "손실 없이 안전",
    ],
)
def test_violations_are_detected_and_softened(text):
    assert violates(text) is True
    softened = sanitize(text)
    # 완화 후에는 위반이 사라져야 한다.
    assert violates(softened) is False
    assert "보장합니다" not in softened


@pytest.mark.parametrize(
    "text",
    [
        "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다.",
        "실제 대출 승인이나 매수를 보장하지 않습니다.",
        "수익을 보장하지 않습니다.",
        "대출 승인을 보장하지 않을 수 있습니다.",
        "확실하지 않습니다.",
        "불확실한 시장 상황입니다.",
        "금리 상승 시 매수 시점이 지연될 수 있습니다.",
        "월 저축액을 늘리면 D-Day 단축 가능성이 있습니다.",
    ],
)
def test_safe_phrases_not_flagged(text):
    # 안전한 부정형 디스클레이머/권고 표현은 위반이 아니며 보존되어야 한다.
    assert violates(text) is False
    assert sanitize(text) == text
