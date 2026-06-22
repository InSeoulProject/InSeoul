# InSeoul

2인 팀 모노레포. Front-end는 Back-end API만 호출하고, Back-end가 인증·사용자 DB·AI 중계를 담당하며,
AI API는 Back-end가 `/internal/ai/*`로만 호출한다.

## 아키텍처

```text
사용자
  ↓
apps/web      # React/Vite Front-end
  ↓ 외부 API 호출 (/api/*)
apps/api      # Back-end: 인증, 사용자별 DB, 시뮬레이션, AI 중계 (Spring Boot, Java 21)
  ├─ Server DB (MySQL 8)
  ├─ packages/calculation
  ├─ packages/data
  └─ apps/ai  # Internal AI API: 자연어 파싱, 전략 카드, 정책 설명 (FastAPI, Python 3.11+)
```

### 핵심 원칙 (깨지 말 것)
- Front-end는 Back-end API만 호출한다. `/internal/ai/*`를 직접 호출하지 않는다.
- Back-end가 인증, 사용자별 DB 저장, AI API 중계를 담당한다.
- AI API는 DB에 직접 저장하지 않으며 가능하면 stateless하게 유지한다.
- 공통 타입은 `packages/shared-contracts`에서 관리한다. 계약 변경 시 Slack 공유 후 이 패키지를 먼저 수정한다.
- 사용자 데이터는 반드시 인증 사용자(`user_id`) 기준으로 저장/조회한다.
- 데모 안정성을 위해 AI fallback 응답을 항상 준비한다.
- `VITE_` prefix 환경변수에 비밀값 금지(브라우저 번들 노출).

## 구조

```text
InSeoul/
├── apps/
│   ├── web/                 # React/Vite
│   ├── api/                 # Spring Boot (Java 21)
│   └── ai/                  # FastAPI (Python 3.11+)
├── packages/
│   ├── shared-contracts/    # 공통 타입, API Request/Response DTO
│   ├── data/                # 지역 가격, 정책대출 seed 데이터
│   └── calculation/         # D-Day 계산 공식, 검증 케이스
├── docs/                    # 가이드, PLAN, ADR
├── scripts/hermes/          # 헤르메스 PM 에이전트
└── .github/workflows/       # CI/CD, 헤르메스 cron
```

## 팀 역할
| 팀원 | 담당 |
|---|---|
| 함동균 | Back-end, Front-end (화면, 인증/사용자 API, DB, FE-BE 연동) |
| 김세민 | AI, Data, CI/CD (AI API, 데이터, 계산 검증, shared-contracts 검토, CI/CD) |

## 로컬 개발

필수: Node 22, Java 21(LTS), Python 3.11+, Docker(+Compose), MySQL 8(또는 Docker).

```bash
npm install            # 루트 + workspaces 설치
npm run build:contracts
npm run lint && npm test && npm run build

# 앱별
cd apps/web && npm run dev          # http://localhost:5173
cd apps/api && ./gradlew bootRun    # http://localhost:8080
cd apps/ai  && uvicorn app.main:app --reload --port 8000   # http://localhost:8000
```

> 이 PC는 Java 25/Python 3.9가 설치돼 있다. `apps/api`는 Gradle toolchain이 Java 21을 자동 프로비저닝하고,
> `apps/ai` 로컬 실행은 Python 3.11+ 설치(pyenv/brew)가 필요하다. CI는 Java 21 / Python 3.11로 고정한다.

## 환경변수
`.env.example`은 커밋, 실제 비밀값은 `.env.local` 또는 CI Secrets에만 둔다. 각 앱 폴더의 `*.env.example` 참고.

## 브랜치 전략
```text
main                  # 보호 브랜치 — PR + CI 통과 필수. CI 실패 시 병합 금지.
feature/web-*         # 프론트
feature/api-*         # 백엔드
feature/ai-*          # AI
feature/data-*        # 데이터/계산
feature/ci-*          # CI/CD
```
이슈키 권장: `feature/api-NSLPRJCT-12-auth`.

## 협업 도구 연동
- **Jira**: Atlassian "GitHub for Jira" 앱 + Smart Commits. 자세한 규약은 [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Slack**: CI 결과 알림(webhook) + GitHub 앱 구독 + 헤르메스 일일 다이제스트. [docs/integrations.md](./docs/integrations.md).
- **헤르메스(PM 에이전트)**: `.github/workflows/hermes.yml` cron — 매 평일 다이제스트를 Slack에 게시.

## API 경계
외부(FE→BE) 및 내부(BE→AI) 엔드포인트 목록은 `packages/shared-contracts`와
[docs/inseoul_external_pc_setup_guide.md](./docs/inseoul_external_pc_setup_guide.md) 8장 참고.
