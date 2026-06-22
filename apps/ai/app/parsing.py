"""한국어 금융 입력 룰기반 파서 — NSLPRJCT-23.

외부 LLM 미설정/실패 시에도 항상 동작하는 결정론적 fallback(NFR-06).
캐주얼 한국어 금액 표현("현금 3천", "월 150", "2억")을 KRW(원)로 환산하고
키워드 근접 매칭으로 재무 필드에 배정한다. DB 미저장·stateless(FR-18).
"""

from __future__ import annotations

import re

# 서울 25개 자치구 — 오탐(예: "출구") 방지용 화이트리스트.
SEOUL_DISTRICTS = [
    "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
    "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
    "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
    "서초구", "강남구", "송파구", "강동구",
]

# missingFields 산출용 기대 필드(순서 고정). firstHomeBuyer는 응답 스키마에는
# 없지만 추가 질문 유도를 위해 missingFields에만 포함(API 설계서 10-3 예시).
EXPECTED_FIELDS = [
    "cashAsset", "jeonseDeposit", "monthlySaving",
    "annualIncome", "firstHomeBuyer", "targetDistrict", "targetPrice",
]
CORE_AMOUNT_FIELDS = ["cashAsset", "jeonseDeposit", "monthlySaving", "annualIncome", "targetPrice"]

# 금액 표현 — 긴 패턴 우선(억+천 콤보 → 억 → 천만 → 천 → 백만 → 백 → 만 → 맨숫자).
_MONEY = (
    r"\d[\d,]*\s*억\s*\d[\d,]*\s*천만?"   # 1억2천만
    r"|\d[\d,]*\s*억\s*\d[\d,]*\s*만"      # 1억 2000만
    r"|\d[\d,]*\s*억"                       # 2억
    r"|\d[\d,]*\s*천만"                     # 3천만
    r"|\d[\d,]*\s*천"                       # 3천 (캐주얼 = 3천만)
    r"|\d[\d,]*\s*백만"                     # 5백만
    r"|\d[\d,]*\s*백"                       # 5백 (캐주얼 = 5백만)
    r"|\d[\d,]*\s*만"                       # 150만
    r"|\d[\d,]*"                            # 150 (캐주얼 = 150만)
)
_MONEY_RE = re.compile(_MONEY)


def _digits(s: str) -> int:
    return int(re.sub(r"[^\d]", "", s) or "0")


def to_won(expr: str) -> int:
    """캐주얼 한국어 금액 표현을 원(KRW) 정수로 환산.

    규칙: 억=절대값(×1e8). 억/만이 없는 캐주얼 표현은 '만원' 단위로 간주
    ("3천"=3천만원=3e7, "150"=150만원=1.5e6). 천=1000, 백=100.
    """
    expr = expr.strip()
    total = 0

    m = re.search(r"(\d[\d,]*)\s*억", expr)
    if m:
        total += _digits(m.group(1)) * 100_000_000
        expr = expr[m.end():]  # 억 뒤 잔여(천/만)는 만원 단위로 누적

    has_man_unit = bool(re.search(r"억|만", expr))

    if re.search(r"천만", expr):
        total += _digits(re.search(r"(\d[\d,]*)\s*천만", expr).group(1)) * 10_000_000
    elif (m := re.search(r"(\d[\d,]*)\s*천", expr)):
        # 억 없는 캐주얼 '3천' → 3천만원. 억 뒤 잔여 '천'도 동일 단위.
        total += _digits(m.group(1)) * 10_000_000
    elif re.search(r"백만", expr):
        total += _digits(re.search(r"(\d[\d,]*)\s*백만", expr).group(1)) * 1_000_000
    elif (m := re.search(r"(\d[\d,]*)\s*백", expr)):
        total += _digits(m.group(1)) * 1_000_000
    elif (m := re.search(r"(\d[\d,]*)\s*만", expr)):
        total += _digits(m.group(1)) * 10_000
    elif (m := re.search(r"(\d[\d,]*)", expr)) and not has_man_unit:
        # 맨숫자 캐주얼 → 만원 단위.
        total += _digits(m.group(1)) * 10_000

    return total


# 필드별 키워드 — (필드명, 키워드 정규식). 금액은 키워드 뒤(우선)·앞 양방향 탐색.
_FIELD_PATTERNS = [
    ("jeonseDeposit", r"전세\s*보증금|전세금|전세|보증금"),
    ("annualIncome", r"세전\s*연봉|연\s*소득|연봉|소득"),
    ("cashAsset", r"보유\s*현금|여유\s*자금|모아둔\s*돈|현금|자산"),
    ("monthlySaving", r"(?<!개)(?:월\s*저축|월\s*적금|월\s*납입|매달|매월|월)"),
    ("targetPrice", r"집값|매매가|매매\s*가격|목표가|호가|예산"),
]

# 키워드↔금액 사이 허용 간극: 숫자 없는 조사/동사 6자 이내(`.*` 금지 → 절 넘나듦 차단).
_GAP = r"[^\d]{0,6}?"

_Span = tuple[int, int]


def _overlaps(span: _Span, used: list[_Span]) -> bool:
    return any(span[0] < u[1] and u[0] < span[1] for u in used)


def _find_amount(text: str, kw_regex: str, used: list[_Span]) -> tuple[int, int, int] | None:
    """키워드에 가장 가까운 금액을 (값, start, end)로. 뒤·앞 양방향 중 간극 최소 선택."""
    after = re.compile(rf"(?:{kw_regex}){_GAP}({_MONEY})\s*원?")
    before = re.compile(rf"({_MONEY})\s*원?{_GAP}(?:{kw_regex})")

    best: tuple[int, int, int] | None = None  # (gap, start, end)
    for m in after.finditer(text):
        span = (m.start(1), m.end(1))
        if not _overlaps(span, used):
            gap = span[0] - m.start()
            if best is None or gap < best[0]:
                best = (gap, span[0], span[1])
    for m in before.finditer(text):
        span = (m.start(1), m.end(1))
        if not _overlaps(span, used):
            gap = m.end() - span[1]
            if best is None or gap < best[0]:
                best = (gap, span[0], span[1])

    if best is None:
        return None
    _, s, e = best
    return to_won(text[s:e]), s, e


def _extract_target_price(text: str, used: list[tuple[int, int]]) -> tuple[int, int, int] | None:
    """'9억짜리', '9억 정도 집/아파트' 형태의 목표가도 포착."""
    pat = re.compile(rf"({_MONEY})\s*원?\s*(?:짜리|대|정도|쯤)?\s*(?:집|아파트|매물|매매)")
    for m in pat.finditer(text):
        span = (m.start(1), m.end(1))
        if any(span[0] < u[1] and u[0] < span[1] for u in used):
            continue
        return to_won(m.group(1)), span[0], span[1]
    return None


def _detect_first_home_buyer(text: str) -> bool | None:
    m = re.search(r"생애\s*최초|생애최초|첫\s*집|첫집|무주택", text)
    if not m:
        return None
    # 부정 표현("무주택 아니고", "생애최초 아니야")은 미감지 처리 → 추가 질문 유도.
    if re.search(r"아니|아님|없|은\s*아|는\s*아", text[m.end():m.end() + 8]):
        return None
    return True


def parse_korean_input(text: str) -> dict:
    """자연어 → 구조화 재무 입력 + missingFields + confidence(룰기반)."""
    result: dict = {
        "cashAsset": None, "jeonseDeposit": None, "monthlySaving": None,
        "annualIncome": None, "targetDistrict": None, "targetPrice": None,
    }
    used: list[tuple[int, int]] = []

    for field, kw in _FIELD_PATTERNS:
        hit = _find_amount(text, kw, used)
        if hit:
            value, s, e = hit
            if value > 0:
                result[field] = value
                used.append((s, e))

    if result["targetPrice"] is None:
        hit = _extract_target_price(text, used)
        if hit and hit[0] > 0:
            result["targetPrice"] = hit[0]
            used.append((hit[1], hit[2]))

    for d in SEOUL_DISTRICTS:
        if d in text:
            result["targetDistrict"] = d
            break

    first_home = _detect_first_home_buyer(text)

    # missingFields — 기대 필드 중 미추출(firstHomeBuyer 포함).
    present = {k for k, v in result.items() if v is not None}
    if first_home:
        present.add("firstHomeBuyer")
    missing = [f for f in EXPECTED_FIELDS if f not in present]

    # confidence(룰기반) — 추출한 핵심 필드 수에 비례, 0.95 상한.
    extracted_core = sum(1 for f in CORE_AMOUNT_FIELDS if result[f] is not None)
    if result["targetDistrict"] is not None:
        extracted_core += 1
    confidence = round(min(0.95, 0.5 + 0.09 * extracted_core), 2) if extracted_core else 0.0

    result["missingFields"] = missing
    result["confidence"] = confidence
    return result
