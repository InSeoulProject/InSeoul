# InSeoul 외부 PC 개발 환경 설정 전달 문서

> 목적: 외부 PC에서 InSeoul 2인 팀 개발을 시작하기 위한 초기 세팅 지침입니다.  
> 대상: 개발 환경을 직접 세팅할 에이전트/개발자  
> 원칙: 모노레포 구조에서 Front-end, Back-end, AI 기능은 API 계약으로 분리해 운영합니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | InSeoul |
| 개발 방식 | 2인 팀, 모노레포 |
| 저장소 | `https://github.com/tpals0409/In-Seoul.git` |
| 협업 도구 | Jira, Slack, GitHub |
| 핵심 구조 | Front-end → Back-end API → Server DB / Internal AI API |

---

## 2. 팀 역할

| 팀원 | 담당 영역 | 책임 |
|---|---|---|
| 함동균 | Back-end, Front-end | 화면 구현, 인증/사용자 API, 서버 DB 저장, FE-BE 연동 |
| 김세민 | AI, Data, CI/CD 자동화 | AI API, 지역/정책 데이터, 계산 검증, shared contracts 검토, CI/CD |

---

## 3. 목표 아키텍처

```text
사용자
  ↓
apps/web      # React/Vite Front-end
  ↓ 외부 API 호출
apps/api      # Back-end: 인증, 사용자별 DB, 시뮬레이션, AI API 중계
  ├─ Server DB
  ├─ packages/calculation
  ├─ packages/data
  └─ apps/ai  # Internal AI API: 자연어 파싱, 전략 카드, 정책 설명
```

### 핵심 원칙

- Front-end는 Back-end API만 호출합니다.
- Front-end에서 `/internal/ai/*`를 직접 호출하지 않습니다.
- Back-end가 인증, 사용자별 DB 저장, AI API 중계를 담당합니다.
- AI API는 가능하면 stateless하게 유지합니다.
- 공통 타입은 `packages/shared-contracts`에서 관리합니다.

---

## 4. 권장 모노레포 구조

```text
InSeoul/
├── apps/
│   ├── web/                 # Front-end: React/Vite
│   ├── api/                 # Back-end: 인증, 사용자 DB, 시뮬레이션 API
│   └── ai/                  # AI API: 자연어 파싱, 전략 카드, 정책 설명
│
├── packages/
│   ├── shared-contracts/    # 공통 타입, API Request/Response DTO
│   ├── data/                # 지역 가격, 정책대출 seed 데이터
│   └── calculation/         # D-Day 계산 공식, 검증 케이스
│
├── docs/                    # 제출 문서, 다이어그램 원본
├── .github/workflows/       # CI/CD
└── README.md
```

> 기존 저장소가 단일 React/Vite 앱 구조라면, 무리하게 한 번에 전체 이전하지 말고 `apps/web`부터 이동 또는 신규 생성하고, `apps/api`, `apps/ai`, `packages/*`를 단계적으로 추가합니다.

---

## 5. 외부 PC 필수 설치 항목

## 공통

| 항목 | 권장 버전 | 확인 명령 |
|---|---:|---|
| Git | 최신 | `git --version` |
| Node.js | 22 LTS 권장 | `node -v` |
| npm | Node 22 동봉 | `npm -v` |
| Java | 21 LTS, Spring 사용 시 | `java -version` |
| Python | 3.11+, AI API 사용 시 | `python --version` 또는 `python3 --version` |
| Docker | 최신, DB/배포용 | `docker --version` |
| Docker Compose | 최신 | `docker compose version` |

## 선택

| 항목 | 용도 |
|---|---|
| MySQL 8 또는 PostgreSQL | 서버 DB |
| IntelliJ IDEA / VS Code | 개발 IDE |
| Postman / Insomnia | API 테스트 |
| Mermaid / PlantUML 플러그인 | 문서 다이어그램 확인 |

---

## 6. 저장소 클론

```bash
git clone https://github.com/tpals0409/In-Seoul.git
cd In-Seoul
```

현재 브랜치 확인:

```bash
git branch --show-current
git remote -v
```

권장 브랜치 전략:

```text
main                  # 최종 제출/배포 기준
feature/web-*         # 프론트 작업
feature/api-*         # 백엔드 작업
feature/ai-*          # AI 기능 작업
feature/data-*        # 데이터/계산 작업
feature/ci-*          # CI/CD 작업
```

---

## 7. 환경변수 원칙

`.env.example`은 커밋하고, 실제 비밀값은 `.env.local` 또는 CI Secrets에만 둡니다.

### 금지

```text
VITE_OPENAI_API_KEY=...
VITE_DB_PASSWORD=...
```

`VITE_` prefix는 브라우저 번들에 노출될 수 있으므로 비밀값 금지.

### 권장 예시

#### apps/web/.env.example

```env
VITE_API_BASE_URL=http://localhost:8080
```

#### apps/api/.env.example

```env
PORT=8080
DATABASE_URL=mysql://user:password@localhost:3306/inseoul
JWT_SECRET=change-me
AI_INTERNAL_BASE_URL=http://localhost:8000
```

#### apps/ai/.env.example

```env
PORT=8000
OPENAI_API_KEY=
AI_MODEL=gpt-4o-mini
```

---

## 8. API 경계

## 8-1. Front-end가 호출하는 외부 API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/users/me` | 내 정보 조회 |
| PUT | `/api/users/me/profile` | 내 재무 프로필 저장 |
| GET | `/api/districts/prices` | 지역 가격 조회 |
| POST | `/api/simulation/golden-cross` | D-Day 계산 및 저장 |
| POST | `/api/simulation/stress-test` | 리스크 계산 |
| POST | `/api/loans/eligibility` | 정책대출 판정 |
| POST | `/api/ai/parse-input` | 자연어 입력 구조화 |
| POST | `/api/ai/strategy-card` | AI 전략 카드 생성 및 저장 |
| GET | `/api/simulation/history` | 사용자별 이력 조회 |

## 8-2. Back-end만 호출하는 내부 AI API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/internal/ai/parse-input` | 자연어 → 구조화 데이터 |
| POST | `/internal/ai/strategy-card` | 계산 결과 → 전략 카드 |
| POST | `/internal/ai/policy-explain` | 정책대출 조건 설명 |
| GET | `/internal/ai/health` | AI 서버 상태 확인 |

---

## 9. 서버 DB 설계 원칙

- 서버 DB를 사용합니다.
- 로그인 기능을 구현합니다.
- 모든 사용자 생성 데이터는 `user_id` 기준으로 분리합니다.
- 물리적으로 사용자마다 DB를 따로 만드는 것이 아니라, MVP에서는 **user_id 기반 논리적 데이터 할당**을 사용합니다.

핵심 테이블:

```text
users
refresh_tokens
user_profiles
districts
district_prices
loan_products
simulations
stress_test_results
loan_eligibility_results
strategy_cards
```

주의:

- 비밀번호는 평문 저장 금지. 반드시 해시 저장.
- `simulationId`로 전략 카드를 만들 때, 해당 시뮬레이션이 로그인 사용자의 것인지 확인.
- 이력 조회 API는 로그인 사용자 본인 데이터만 반환.

---

## 10. 초기 세팅 순서

## Step 1. 저장소 클론 및 기본 실행 확인

```bash
git clone https://github.com/tpals0409/In-Seoul.git
cd In-Seoul
npm install
npm run lint
npm test
npm run build
```

> 기존 저장소가 이미 Vite/React 기반이면 위 명령부터 확인합니다. 실패 시 로그를 저장하고 수정 범위를 분리합니다.

## Step 2. 모노레포 구조 전환 계획 확인

- 기존 앱을 `apps/web`로 옮길지, 신규 모노레포 구조를 만든 뒤 점진 이전할지 결정합니다.
- 2인 개발 안정성을 우선하면 “신규 구조 생성 → 기존 코드 점진 이전”이 안전합니다.

## Step 3. 공통 타입 패키지 생성

```text
packages/shared-contracts/
├── auth.ts
├── user.ts
├── simulation.ts
├── loan.ts
├── ai.ts
└── common.ts
```

## Step 4. Back-end API Skeleton 생성

필수 API:

```text
/api/auth/signup
/api/auth/login
/api/users/me
/api/users/me/profile
/api/simulation/golden-cross
/api/ai/parse-input
/api/ai/strategy-card
```

## Step 5. AI API Skeleton 생성

필수 API:

```text
/internal/ai/parse-input
/internal/ai/strategy-card
/internal/ai/policy-explain
/internal/ai/health
```

## Step 6. Mock 기반 병렬 개발

- 함동균: FE 화면에서 Mock Back-end 응답 연동
- 김세민: AI API mock response 작성
- 공동: shared-contracts 변경 시 Slack 공유

## Step 7. DB 연결

- 개발 DB 실행
- 마이그레이션 작성
- users/user_profiles/simulations/strategy_cards부터 구현

## Step 8. CI/CD 확인

PR 또는 push 시 다음 검증 수행:

```text
lint
unit test
build
```

모노레포 전환 후에는 path filter로 web/api/ai/packages 변경 범위별 검증을 분리할 수 있습니다.

---

## 11. 개발 전 체크리스트

- [ ] Git clone 완료
- [ ] Node 22 확인
- [ ] npm install 성공
- [ ] 기존 lint/test/build 결과 확인
- [ ] `.env.example` 확인
- [ ] 실제 `.env.local` 생성
- [ ] DB 실행 가능 여부 확인
- [ ] API 포트 확정
- [ ] AI API 포트 확정
- [ ] Jira Epic 생성
- [ ] Slack 개발 공유 채널/스레드 확정
- [ ] shared-contracts 초안 작성
- [ ] FE/BE/AI Mock 응답 합의

---

## 12. Jira Epic 추천

```text
EPIC-01 기획/설계
EPIC-02 모노레포 구조 전환
EPIC-03 인증/사용자 DB
EPIC-04 Front-end
EPIC-05 Back-end API
EPIC-06 AI API
EPIC-07 Data/Calculation
EPIC-08 CI/CD
EPIC-09 통합/QA
EPIC-10 발표/제출
```

---

## 13. Slack 공유 규칙

매일 또는 작업 시작/종료 시 아래 형식으로 공유합니다.

```text
[InSeoul 작업 공유]
담당자:
오늘 목표:
완료:
블로커:
API/계약 변경 여부:
다음 작업:
```

API 계약 변경이 있으면 반드시 Slack에 공유하고, `packages/shared-contracts`를 먼저 수정합니다.

---

## 14. 개발 시작 우선순위

1. `packages/shared-contracts` 작성
2. 회원가입/로그인 API Skeleton
3. 사용자별 DB 테이블 생성
4. D-Day 계산 API Skeleton
5. AI 내부 API Skeleton
6. Front-end Mock 연동
7. 실제 API 연동
8. CI 검증

---

## 15. 에이전트에게 요청할 작업 지시 예시

```text
InSeoul 외부 PC 개발 환경을 세팅해줘.
저장소는 https://github.com/tpals0409/In-Seoul.git 이고,
모노레포 구조는 apps/web, apps/api, apps/ai, packages/shared-contracts, packages/data, packages/calculation 기준이야.

먼저 현재 저장소 구조와 package.json을 확인하고,
기존 앱이 있으면 apps/web로 이동할지 신규 구조를 만들지 판단해줘.

그 다음 shared-contracts, API skeleton, AI internal API skeleton, DB schema, CI workflow 순서로 진행해줘.
프론트는 Back-end API만 호출하고, AI는 Back-end가 /internal/ai/*로 호출하는 구조로 유지해줘.
```

---

## 16. 주의사항

- 개발 시작 전 문서에 정의된 API 경계를 깨지 말 것.
- Front-end에서 AI API를 직접 호출하지 말 것.
- AI API가 DB에 직접 저장하지 않도록 할 것.
- 사용자 데이터는 반드시 인증 사용자 기준으로 저장/조회할 것.
- 데모 안정성을 위해 AI fallback 응답을 반드시 준비할 것.
- CI가 실패하면 main에 병합하지 말 것.
