"""룰기반 한국어 파서 단위 테스트 — NSLPRJCT-23."""

import pytest

from app.parsing import parse_korean_input, to_won


@pytest.mark.parametrize(
    "expr,expected",
    [
        ("2억", 200_000_000),
        ("3천", 30_000_000),
        ("3천만", 30_000_000),
        ("150", 1_500_000),
        ("150만", 1_500_000),
        ("100만", 1_000_000),
        ("5백만", 5_000_000),
        ("5백", 5_000_000),
        ("1억2천만", 120_000_000),
        ("9억", 900_000_000),
        ("3,000만", 30_000_000),
    ],
)
def test_to_won(expr, expected):
    assert to_won(expr) == expected


def test_parse_full_sentence():
    r = parse_korean_input(
        "전세 보증금 2억 있고 현금은 3천 있어. 월 150 저축 가능하고 마포구를 보고 있어."
    )
    assert r["cashAsset"] == 30_000_000
    assert r["jeonseDeposit"] == 200_000_000
    assert r["monthlySaving"] == 1_500_000
    assert r["targetDistrict"] == "마포구"
    assert r["confidence"] == 0.86


def test_parse_income_and_price():
    r = parse_korean_input("연봉 6천만이고 9억짜리 아파트 보고 있어. 생애최초야.")
    assert r["annualIncome"] == 60_000_000
    assert r["targetPrice"] == 900_000_000
    # 생애최초 → firstHomeBuyer는 missing이 아니어야 한다.
    assert "firstHomeBuyer" not in r["missingFields"]


def test_parse_amount_before_keyword():
    # 금액이 키워드 앞에 오는 표현도 잡아야 한다.
    r = parse_korean_input("3천 현금 있고 2억 전세 보증금에 9억 예산이야")
    assert r["cashAsset"] == 30_000_000
    assert r["jeonseDeposit"] == 200_000_000
    assert r["targetPrice"] == 900_000_000


def test_first_home_buyer_negation():
    # 부정 표현은 firstHomeBuyer 미감지 → 여전히 missing.
    r = parse_korean_input("무주택 아니야. 현금 3천 있어.")
    assert r["cashAsset"] == 30_000_000
    assert "firstHomeBuyer" in r["missingFields"]


def test_parse_avoids_months_false_positive():
    # "36개월"의 '월'을 monthlySaving으로 오인하지 않아야 한다.
    r = parse_korean_input("앞으로 36개월 안에 강남구 집을 사고 싶어")
    assert r["monthlySaving"] is None
    assert r["targetDistrict"] == "강남구"


def test_parse_empty():
    r = parse_korean_input("그냥 상담받고 싶어요")
    assert r["confidence"] == 0.0
    # 아무것도 못 뽑으면 기대 필드 전체가 missing.
    assert "cashAsset" in r["missingFields"]
    assert "targetPrice" in r["missingFields"]
    assert "firstHomeBuyer" in r["missingFields"]
