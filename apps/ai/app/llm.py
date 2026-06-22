"""외부 LLM 클라이언트 — SSAFY GMS 프록시(Anthropic Messages 호환).

docs/integrations.md 기준: 기본 엔드포인트는 GMS 프록시이며 키는 x-api-key.
미설정/실패/타임아웃 시 None을 반환하여 호출부가 항상 fallback으로 분기(NFR-06).
AI는 stateless, DB 미저장(FR-18).
"""

from __future__ import annotations

import json
import os

import httpx


def _env_float(name: str, default: float) -> float:
    """잘못된 설정값이 import 단계에서 앱을 죽이지 않도록 안전 파싱(NFR-06)."""
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# GMS_KEY(헤르메스와 공용) 우선, 일반화된 LLM_API_KEY도 허용.
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("GMS_KEY") or ""
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://gms.ssafy.io/gmsapi/api.anthropic.com")
AI_MODEL = os.getenv("AI_MODEL", "claude-sonnet-4-6")
ANTHROPIC_VERSION = os.getenv("ANTHROPIC_VERSION", "2023-06-01")
LLM_TIMEOUT = _env_float("LLM_TIMEOUT", 12.0)


def llm_available() -> bool:
    """LLM 호출 가능 여부(키 존재). false면 fallback 모드."""
    return bool(LLM_API_KEY)


def complete_text(
    system: str,
    user: str,
    *,
    max_tokens: int = 700,
    temperature: float = 0.2,
) -> str | None:
    """Anthropic Messages 호출 → 응답 텍스트. 실패 시 None."""
    if not llm_available():
        return None
    try:
        resp = httpx.post(
            f"{LLM_BASE_URL}/v1/messages",
            headers={
                "x-api-key": LLM_API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
            timeout=LLM_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        parts = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
        text = "".join(parts).strip()
        return text or None
    except Exception:
        # 네트워크/HTTP/파싱 오류 모두 fallback으로 흡수(데모 안정성).
        return None


def complete_json(
    system: str,
    user: str,
    *,
    max_tokens: int = 700,
    temperature: float = 0.0,
) -> dict | None:
    """JSON 객체만 반환하도록 유도한 응답을 파싱. 실패 시 None."""
    text = complete_text(system, user, max_tokens=max_tokens, temperature=temperature)
    if not text:
        return None
    return _extract_json(text)


def _extract_json(text: str) -> dict | None:
    """코드펜스/잡설이 섞여도 첫 JSON 객체를 추출."""
    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        candidate = candidate[candidate.find("{"):] if "{" in candidate else candidate
    start, end = candidate.find("{"), candidate.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        obj = json.loads(candidate[start:end + 1])
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        return None
