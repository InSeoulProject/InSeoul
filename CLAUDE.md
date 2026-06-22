# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InSeoul — 서울 아파트 매수 타이밍 AI 시뮬레이터. 2인 팀 모노레포 (함동균: BE/FE, 김세민: AI/Data/CI).

**핵심 아키텍처 원칙 (절대 위반 금지):**
- FE(`apps/web`)는 `apps/api`만 호출. `/internal/ai/*` 직접 호출 금지 (NFR-12)
- AI API(`apps/ai`)는 DB에 직접 쓰지 않음. stateless.
- 모든 사용자 데이터는 `user_id` 기준으로 조회/저장. 소유권 검증 필수.
- AI fallback 항상 준비 (NFR-06)
- `VITE_` 접두어 env var에 시크릿 금지

## Monorepo Structure

```
apps/web          React 18 + Vite 5, TypeScript, port 5173
apps/api          Spring Boot 3.3.5, Java 21, port 8080
apps/ai           FastAPI, Python 3.11+, port 8000
packages/shared-contracts   TS 타입 단일 소스 (@inseoul/shared-contracts)
packages/calculation        Golden Cross 공식 TS 구현 (@inseoul/calculation)
packages/data               지역/정책 시드 데이터
infra/slack-relay           Cloudflare Worker (Slack → GitHub dispatch)
scripts/hermes/             PM 자동화 (일일 다이제스트, Jira 명령)
```

## Commands

### 전체 모노레포 (루트)
```bash
npm install                    # 전체 의존성 설치 (npm workspaces)
npm run build                  # 전체 빌드
npm run lint                   # 전체 린트
npm run build:contracts        # shared-contracts만 빌드 (먼저 실행 필요)
```

### apps/web (React/Vite)
```bash
cd apps/web
npm run dev          # 개발 서버 (port 5173)
npm run build        # TypeScript 컴파일 + Vite 빌드
npm run lint         # tsc --noEmit
```

### apps/api (Spring Boot)
```bash
cd apps/api
export JAVA_HOME=/home/dh4m/jdk-21.0.4+7   # 로컬 JDK 경로 (Java 21)

./gradlew build --no-daemon                  # 전체 빌드 + 테스트
./gradlew compileJava                        # 컴파일만
./gradlew test                               # 전체 테스트
./gradlew test --tests "*.GoldenCrossCalculatorTest"   # 단일 테스트 클래스
./gradlew bootRun                            # 로컬 실행 (MySQL 필요)
SPRING_PROFILES_ACTIVE=test ./gradlew test  # H2 인메모리로 테스트 (MySQL 불필요)
```

CI는 Java 21 (Temurin) 자동 프로비저닝. 로컬은 `/home/dh4m/jdk-21.0.4+7` 사용.

### apps/ai (FastAPI)
```bash
cd apps/ai
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000    # 개발 서버
pytest -q                                    # 테스트
ruff check .                                 # 린트
```

Python 3.11+ 필요 (로컬 3.9이면 pyenv로 3.11+ 설치 필요).

## apps/api Architecture

**패키지 구조:** `kr.inseoul.api.<domain>/`

각 도메인은 `domain/`(JPA 엔티티), `dto/`(요청/응답), Service, Repository, Controller 로 구성.

| 도메인 | 역할 |
|--------|------|
| `auth` | 회원가입/로그인/로그아웃/토큰갱신. refresh token rotation. |
| `user` | 사용자 조회, 프로필 upsert |
| `district` | 지역 가격 조회 (공개 엔드포인트) |
| `calculation` | Golden Cross 공식 Java 재구현. TS `packages/calculation`과 동일 로직 (NFR-03) |
| `simulation` | D-Day 계산·저장, 스트레스 테스트 3시나리오, 이력 조회 |
| `loan` | 4개 정책대출 판정 (보금자리론/디딤돌/청년전세/신혼부부) |
| `ai` | `/api/ai/*` → `/internal/ai/*` 중계. fallback 포함. strategy-card는 DB 저장. |
| `security` | JWT 발급/검증, `JwtAuthenticationFilter`, `UserPrincipal` |
| `config` | SecurityConfig (permitAll: /health, /api/auth/*, /api/districts/prices), RestClient, JwtProperties |
| `common` | `ApiResponse<T>`, `GlobalExceptionHandler`, 예외 계층 |

**주요 설계 결정:**
- cross-domain FK는 `@ManyToOne` 대신 plain `Long` 컬럼 (N+1 방지)
- `ddl-auto: validate` — Flyway가 스키마 소유, JPA는 검증만
- 테스트 프로파일(`test`)은 H2 MySQL-mode 사용 — 실 MySQL 없이 CI 통과
- `calculation` 공식: `monthlyReturnRate=0` (TS 기본값과 동일). HTTP `interestRate`는 이력 저장용만.

**DB 스키마:** `V1__init.sql` (10개 테이블), `V2__seed_districts.sql` (25개 자치구), `V3__seed_loan_products.sql` (4개 상품)

**인증 흐름:** `Bearer {accessToken}` (30분) → `JwtAuthenticationFilter` → `SecurityContext`에 `UserPrincipal(userId, email)` 주입. 컨트롤러에서 `@AuthenticationPrincipal UserPrincipal`로 꺼냄.

## apps/ai Architecture

`app/main.py` 단일 파일. `OPENAI_API_KEY` 없으면 degraded mode(fallback 응답).

| 엔드포인트 | 상태 |
|-----------|------|
| `GET /internal/ai/health` | 완료 |
| `POST /internal/ai/parse-input` | fallback only (TODO: LLM Function Calling) |
| `POST /internal/ai/strategy-card` | 완료 (fallback 기반) |
| `POST /internal/ai/policy-explain` | 완료 (정적 텍스트) |

## apps/web Architecture

현재 스켈레톤 상태. `src/api.ts`에 fetch 래퍼 패턴 정의됨.

- `VITE_API_BASE_URL` env var로 BE URL 지정 (기본 `http://localhost:8080`)
- `@inseoul/shared-contracts` 타입 import해서 사용
- 모든 API 호출은 `src/api.ts`를 통해 `/api/*`로만 호출

## packages/shared-contracts

API 계약의 단일 소스. **변경 전 Slack 공유 필수.** 변경 시 web/api/ai 동시 반영.

```
src/common.ts     ApiResponse<T>, ApiError, Won, IsoDateTime
src/auth.ts       SignupRequest, LoginRequest, AuthData
src/user.ts       User, UserProfile, UpdateProfileRequest
src/simulation.ts DistrictPrice, GoldenCrossRequest/Data, StressTest*
src/loan.ts       LoanProduct, LoanStatus, LoanEligibilityRequest/Data
src/ai.ts         InternalParseInput*, InternalStrategyCard*, PolicyExplain*
```

`npm run build:contracts` 후 web에서 사용 가능.

## CI/CD

`.github/workflows/ci.yml`: paths-filter로 변경된 앱만 빌드.
- `contracts` → `npm ci && npm run build && npm run lint`
- `web` → lint + test + build (Node 22)
- `api` → `./gradlew build --no-daemon` (Java 21 Temurin)
- `ai` → `ruff check` + `pytest -q` (Python 3.11)

**api job에 `SPRING_PROFILES_ACTIVE=test` 환경변수 필요** (H2로 MySQL 없이 테스트).

Hermes 자동화: `scripts/hermes/` — 일일 PM 다이제스트(claude-sonnet-4-6, GMS proxy), Jira 명령 에이전트. GMS endpoint: `https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages`

## Jira / Git 컨벤션

- Jira 프로젝트 키: `NSLPRJCT`
- 브랜치: `feature/<area>-<issueKey>-<slug>` (area: web/api/ai/data/ci)
- 커밋: `<issueKey> <type>(<scope>): <subject>`
- PR 제목에 Jira 키 포함: `NSLPRJCT-12 feat(api): golden-cross endpoint`
- Smart Commit: `NSLPRJCT-12 #done #time 2h`
