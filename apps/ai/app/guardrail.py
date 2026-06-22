"""AI 출력 가드레일 — NFR-04(매수 확정·수익/대출 승인 보장 표현 금지).

LLM 응답을 완화(sanitize)하고, 남은 단정/보장 표현을 검출(violates)한다.
'보장하지 않습니다' 같은 안전한 부정형 디스클레이머는 위반으로 보지 않는다.
"""

from __future__ import annotations

import re

DISCLAIMER = "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다."

# 긍정형 보장/단정 표현 → 가능성 기반 표현으로 완화.
# 핵심: 토큰 뒤를 `\S*` 로 탐욕 매칭하지 않는다(그러면 '보장하지'의 '하지'를 삼켜
# 안전한 부정형 디스클레이머를 훼손). 부정 연결어 '지'를 포함하지 않는 긍정 어미만 허용하고,
# 부정형 여부는 _replace_unless_safe 가 매치 직후를 따로 검사한다.
_END = r"(?:합니다|해요|했어요|해|됩니다|된다|돼요|함|히|한|하다|하게|하니)?"
_NO = r"(?:습니다|어요|음|이|는)?"  # '없' 의 긍정 어미
_SOFTEN = [
    (re.compile(rf"수익(을|이)?\s*(?:보장|확실){_END}"), "수익 가능성이 있습니다"),
    (re.compile(rf"(?:대출\s*)?승인(을|이)?\s*(?:보장|확실){_END}"), "승인 가능성이 있습니다"),
    (re.compile(rf"원금(을|이)?\s*보장{_END}"), "원금 변동 가능성이 있습니다"),
    (re.compile(rf"원금\s*손실\s*(?:이|은)?\s*없{_NO}"), "원금 변동 가능성이 있습니다"),
    (re.compile(rf"(?:손실|손해|위험|리스크)\s*(?:가|이|은)?\s*없{_NO}"), "변동 가능성이 있습니다"),
    (re.compile(rf"매수(를|가)?\s*확정{_END}"), "매수 가능성이 있습니다"),
    (re.compile(rf"보장{_END}"), "가능성이 있습니다"),
    (re.compile(rf"확정{_END}"), "예상"),
    (re.compile(rf"(?<!불)확실{_END}"), "예상"),
    (re.compile(r"무조건|반드시|절대로|틀림없이|100\s*%"), "대체로"),
]

# 매치 직후에 오는 안전한 부정형('하지 않', '되지 않', '할 수 없').
_NEG_AFTER = re.compile(r"\s*(?:하지|되지|받지)\s*(?:않|못)|\s*할\s*수\s*없")
# violates 검사 전 제거할 안전한 부정형 디스클레이머 / 불확실 표현.
_SAFE_NEG = re.compile(
    r"(?:보장|확정|확실)\s*(?:하지|되지|받지)\s*(?:않|못)\S*"
    r"|(?:보장|확정)\s*할\s*수\s*없\S*"
    r"|불확실\S*"
)
# 남으면 위반으로 보는 강한 단정/보장 토큰.
_VIOLATION = re.compile(
    r"보장|확정|확실|무조건|반드시|절대로|틀림없|100\s*%"
    r"|(?:손실|손해|위험|리스크)\s*(?:가|이|은)?\s*없"
)


def _replace_unless_safe(match: re.Match, full: str, repl: str) -> str:
    # 매치 직후가 부정형('보장하지 않')이면 안전 디스클레이머이므로 원문 보존.
    return match.group(0) if _NEG_AFTER.match(full, match.end()) else repl


def sanitize(text: str) -> str:
    """긍정형 보장/단정 표현을 완화. 안전한 부정형 디스클레이머는 보존."""
    for pat, repl in _SOFTEN:
        text = pat.sub(lambda m, r=repl, t=text: _replace_unless_safe(m, t, r), text)
    return text


def violates(text: str) -> bool:
    """완화 후에도 남은 단정/보장 표현이 있으면 True(안전한 부정형은 제외)."""
    cleaned = _SAFE_NEG.sub("", text)
    return bool(_VIOLATION.search(cleaned))


def enforce(text: str) -> tuple[str, bool]:
    """완화 적용 후 (정제된 텍스트, 위반여부). 위반 시 호출부가 fallback으로 분기."""
    cleaned = sanitize(text)
    return cleaned, violates(cleaned)
