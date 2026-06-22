# InSeoul 모노레포 신규 셋업 + CI/CD + Jira + Slack + 헤르메스 에이전트

## Context

`inseoul_external_pc_setup_guide.md`가 정의한 2인 팀(함동균=BE/FE, 김세민=AI/Data/CI-CD)
모노레포 아키텍처를 **새 레포에서 처음부터** 구성한다.

- 기존 `github.com/tpals0409/In-Seoul`은 **버전1(레퍼런스)** — 단일 Vite/React+Capacitor 앱.
  유지하지 않고 새 레포에서 가이드 구조(`apps/web·api·ai`, `packages/*`)로 새로 시작한다.
- 확정 결정:
  - **Back-end(`apps/api`)**: Spring Boot (Java 21)
  - **Front-end(`apps/web`)**: 신규 생성 (버전1 코드 미이식, 컨트랙트부터 시작)
  - **AI(`apps/ai`)**: Python 3.11+ / FastAPI (가이드 가정)
  - **DB**: MySQL 8 (가이드 `.env` 예시 가정)
  - **Jira**: Atlassian GitHub 앱 + Smart Commits
  - **Slack**: CI 결과 알림 + GitHub 활동 알림 + 일일 공유 템플릿
  - **헤르메스(PM 에이전트)**: 스케줄 GitHub Action(cron), Claude API(`claude-haiku-4-5`),
    담당 = 일일 다이제스트 / Jira 동기화 보조 / 릴리스·제출 노트 / 블로커·스탠드업 취합

목표 결과: 새 레포 1개에 다언어 모노레포 골격 + path-filter 기반 CI + Jira/Slack 연동 +
헤르메스 cron 에이전트가 동작하고, PR→CI 통과→main 머지 흐름이 자리잡는다.

> 핵심 경계(가이드 16장): FE는 BE API만 호출, BE만 `/internal/ai/*` 호출, AI는 DB 직접 접근 금지,
> 사용자 데이터는 인증 사용자 기준 저장/조회, AI fallback 응답 필수.

---

## 확정 사항 (조사 완료)

- **레포**: `https://github.com/InSeoulProject/InSeoul.git` (org `InSeoulProject`) —
  **이미 존재, 비어 있음(empty), public, default `main`**. 생성 불필요, 바로 push.
- **작업 위치 = 클론한 레포 안** (방식 A): 현재 폴더
  `/Users/kimsemin/Desktop/2026/InSeoul`는 git 레포가 아니라 클라우드(Ultraplan) 세션이
  못 뜬다. 빈 레포를 로컬에 클론한 디렉터리를 **유일한 작업 루트**로 삼고, 그 안에서
  스캐폴딩·커밋·푸시하며 Ultraplan도 그 폴더에서 실행한다.
  기존 `inseoul_external_pc_setup_guide.md`와 플랜은 클론 폴더의 `docs/`로 옮긴다.
- **로컬 툴체인** (확인됨):
  - ✅ Node `v22.22.3`, git `2.50.1`, Docker 설치됨
  - ⚠️ **Java 25** 설치 (가이드 권장 21 LTS) → CI는 `temurin 21`로 고정, 로컬은 Gradle
    `toolchain { languageVersion = 21 }`로 21 자동 프로비저닝(설치 강제 안 함)
  - ⚠️ **Python 3.9.6** (AI는 3.11+ 필요) → CI는 3.11 고정, `apps/ai` 로컬 실행 시
    3.11+ 설치 필요(pyenv/brew). contracts·web·CI 단계는 영향 없음
  - ℹ️ `gh` 미설치 — 레포 생성 불필요하므로 무관. Secret은 GitHub 웹 UI로 등록(또는 `brew install gh`)

## 선행 조건 (4~8단계 연동 시 제공 필요)

코드에는 절대 커밋하지 않고 GitHub Secrets/`.env.local`에만.

| 항목 | 용도 | 비고 |
|---|---|---|
| Jira 사이트 URL + 프로젝트 키 | Smart Commits 이슈키(예: `INS-1`) | Atlassian GitHub 앱 설치 권한(조직 admin) 필요 |
| Slack 워크스페이스 + 채널 | 알림 대상 | Incoming Webhook 생성 권한, GitHub 앱 설치 권한 |
| `SLACK_WEBHOOK_URL` | CI/헤르메스 알림 | GitHub Secret |
| `ANTHROPIC_API_KEY` | 헤르메스 에이전트 | GitHub Secret |
| (선택) `JIRA_*` read 토큰 | 헤르메스가 Jira를 *읽을* 때만 | 앱 방식 링크엔 불필요 |

---

## 1단계 — 새 레포 골격 (모노레포 + npm workspaces)

루트는 npm workspaces로 JS 패키지(`apps/web`, `packages/*`)를 묶고, `apps/api`(Gradle)·`apps/ai`(Python)는
각자 툴체인으로 독립 빌드. CI에서 path-filter로 분리.

생성할 핵심 파일:
- `package.json` (루트) — `"workspaces": ["apps/web", "packages/*"]`, `"packageManager": "npm@10"`,
  스크립트: `lint`/`test`/`build`를 workspace 위임(`npm run -ws ...`)
- `.gitignore` — `node_modules`, `.env.local`, `dist`, `build`, `.gradle`, `__pycache__`, `*.pyc`, `.venv`
- `README.md` — 아키텍처 다이어그램(가이드 3장), 실행법, 브랜치 전략(가이드 6장)
- `.nvmrc` → `22`
- `docs/` — 가이드 문서 이동, ADR 디렉토리

브랜치 전략(가이드 6장): `main`(보호) + `feature/web-*`/`api-*`/`ai-*`/`data-*`/`ci-*`.
main에 branch protection: PR 필수 + CI 필수 통과(가이드 16장 "CI 실패 시 main 병합 금지").

## 2단계 — `packages/shared-contracts` (최우선, 가이드 14장)

가이드 8장 API 경계를 TypeScript 타입으로 정의. FE/BE/AI 합의의 단일 소스.
```
packages/shared-contracts/
├── package.json (name: @inseoul/shared-contracts)
├── tsconfig.json
└── src/{auth,user,simulation,loan,ai,common}.ts + index.ts
```
- `common.ts`: 공통 에러/페이지네이션/`ApiResponse<T>`
- `auth.ts`: signup/login/logout DTO
- `simulation.ts`: golden-cross/stress-test 요청·응답
- `ai.ts`: `/api/ai/*`(외부) + `/internal/ai/*`(내부) DTO 분리
- Java/Python은 이 타입을 **참조 규약**으로 사용(MVP에선 수동 동기화; 변경 시 Slack 공유 — 가이드 13장)

`packages/data`, `packages/calculation`도 빈 스캐폴드 + `package.json`만 우선 생성.

## 3단계 — 앱 스캐폴드 (skeleton, Mock 우선)

- **`apps/web`**: `npm create vite@latest`(react-ts), `VITE_API_BASE_URL`만 사용,
  `apps/web/.env.example` (가이드 7장). FE는 BE API만 호출.
- **`apps/api`** (Spring Boot, Java 21): Gradle, 가이드 8-1 엔드포인트 컨트롤러 스텁(빈 200 응답),
  `apps/api/.env.example`(`PORT=8080`, `DATABASE_URL`, `JWT_SECRET`, `AI_INTERNAL_BASE_URL`),
  DB 스키마 마이그레이션(Flyway) — 가이드 9장 테이블, 비밀번호 해시, `user_id` 논리 분리.
- **`apps/ai`** (FastAPI): 가이드 8-2 `/internal/ai/*` + `/health`, mock+fallback 응답,
  `apps/ai/.env.example`(`PORT=8000`, `OPENAI_API_KEY=`, `AI_MODEL=`).
- 루트 `.env.example` 3개 모두 커밋, 실제값은 `.env.local`(gitignore).

## 4단계 — GitHub Actions CI/CD (path-filter)

`.github/workflows/ci.yml` — `dorny/paths-filter`로 변경 범위 감지, 영향받은 잡만 실행.
```
on: { pull_request: { branches: [main] }, push: { branches: [main] } }
jobs:
  changes:        # paths-filter → web/api/ai/packages outputs
  web:   if web||packages   → setup-node 22 + npm ci + lint + test + build
  api:   if api             → setup-java 21(temurin) + ./gradlew build test
  ai:    if ai              → setup-python 3.11 + pip install + ruff + pytest
  contracts: if packages    → tsc --build packages/*
```
- `concurrency` + `cancel-in-progress` (버전1 ci.yml 패턴 차용)
- 각 잡 결과를 5단계 Slack 알림 잡이 needs로 받아 통합 리포트.

## 5단계 — Slack 연동

1. **CI 결과 알림**: `ci.yml` 마지막에 `slackapi/slack-github-action`(또는 webhook curl) 잡 추가.
   `if: always()`, 각 잡 result 집계 → 성공/실패 메시지(`SLACK_WEBHOOK_URL` Secret).
2. **GitHub 활동 알림**: 코드 변경 아님 — Slack에서 GitHub 앱 설치 후 채널에서
   `/github subscribe tpals0409/<repo> pulls issues reviews`. (README에 절차 문서화)
3. **일일 공유 템플릿**: 가이드 13장 포맷 → `.github/ISSUE_TEMPLATE/daily-share.md` 또는
   헤르메스 다이제스트(6단계)에 포함.

## 6단계 — Jira 연동 (Atlassian GitHub 앱 + Smart Commits)

코드 변경 거의 없음 — 설정/규약 중심. README + CONTRIBUTING에 문서화:
- Atlassian "GitHub for Jira" 앱을 새 레포에 연결(조직 admin).
- Smart Commit 규약: 커밋/PR 제목에 이슈키 포함 `INS-12 feat(api): ...`,
  전환 명령 `#in-progress` / `#done`, 코멘트 `#comment ...`.
- 가이드 12장 Epic(EPIC-01~10)을 Jira에 생성(수동).
- 브랜치 네이밍에 이슈키 권장: `feature/api-INS-12-auth`.

## 7단계 — 헤르메스 PM 에이전트 (스케줄 cron Action)

`.github/workflows/hermes.yml` — `schedule: cron`(예: 매 평일 09:00 KST = `0 0 * * 1-5` UTC) + `workflow_dispatch`.
런타임: Node 또는 Python 스크립트 `scripts/hermes/` — GitHub REST(PR/이슈/CI 런)와 Jira REST를 수집,
Claude API로 요약해 Slack에 게시.

- **모델**: `claude-haiku-4-5` (입력 $1 / 출력 $5 per MTok, 200K 컨텍스트) — 저비용 요약에 적합.
  품질 부족 시 `claude-sonnet-4-6`로 상향. **`budget_tokens` 사용 금지** — 4.x는 `thinking:{type:"adaptive"}` + `output_config.effort` (요약은 `effort:"low"` 권장).
- **호출 방식**: 공식 Anthropic SDK(언어에 맞춰 `@anthropic-ai/sdk` 또는 `anthropic`), 단일 메시지 요약 호출.
  `client.messages.create({ model:"claude-haiku-4-5", max_tokens:2048, messages:[...] })`.
- **담당 작업**(사용자 선택):
  1. *일일 다이제스트* — 전날 머지 PR / 열린 PR / CI 실패 / Jira 이동을 요약해 Slack 게시
  2. *Jira 동기화 보조* — PR↔이슈키 누락 PR 경고, Epic 진행률 리포트
  3. *릴리스/제출 노트* — main 머지 변경 모아 노트 초안
  4. *블로커/스탠드업 취합* — 가이드 13장 공유 포맷 수집·정리
- **Secrets**: `ANTHROPIC_API_KEY`, `SLACK_WEBHOOK_URL`. Jira REST 사용 시 `JIRA_BASE_URL`/`JIRA_USER_EMAIL`/`JIRA_API_TOKEN`
  (앱 방식이 링크만 담당하므로 헤르메스가 Jira를 *읽으려면* 별도 read 토큰 필요 — 2단계에선 GitHub만으로 시작 가능).
- 단계적 도입: 우선 (1) 일일 다이제스트만 구현·검증 → 이후 (2)(3)(4) 확장.

---

## 실행 순서 (가이드 10·14장 우선순위 반영)

0. **작업 위치 확보 (방식 A)**: `git clone https://github.com/InSeoulProject/InSeoul.git`
   (예: `~/Desktop/2026/`에 클론 → `~/Desktop/2026/InSeoul-repo` 등 git 레포 폴더 확보).
   기존 가이드 md·플랜을 클론 폴더 `docs/`로 이동. 이 폴더에서 이후 모든 작업/Ultraplan 실행.
1. 1단계 골격(workspaces, gitignore, README, 브랜치 전략) → main push
2. `packages/shared-contracts` 작성 (가이드 14장 1순위)
3. `apps/web`·`apps/api`·`apps/ai` skeleton + `.env.example` 3종
4. `ci.yml` (path-filter) — lint/test/build 통과 확인
5. Slack CI 알림 잡 + GitHub 앱 구독 문서화
6. Jira 앱 연결 + Smart Commit 규약 문서화
7. `hermes.yml` 일일 다이제스트 구현
8. main branch protection(PR + CI 필수) 활성화

## 검증 (end-to-end)

- **로컬**: `node -v`(22)·`java -version`(21)·`python3 --version`(3.11+) 확인 →
  `npm ci` → `npm run -ws build` 성공 → `apps/ai` `uvicorn` 기동 후 `GET /internal/ai/health` 200 →
  `apps/api` `./gradlew bootRun` 후 헬스 엔드포인트 200.
- **CI**: 각 앱에 의도적 변경을 담은 feature 브랜치 PR → paths-filter가 해당 잡만 돌리는지,
  lint/test/build 통과 후 Slack에 성공 알림 오는지 확인. lint 실패 PR로 main 머지 차단 확인.
- **Jira**: 커밋 메시지에 `INS-1 #comment test` 넣고 push → Jira 이슈에 코멘트/링크 반영 확인.
- **Slack**: `/github subscribe` 후 PR 열어 채널 알림 확인.
- **헤르메스**: `workflow_dispatch`로 수동 실행 → 다이제스트가 Slack 채널에 게시되는지 확인
  (cron 대기 없이 즉시 검증).

## 주의 (가이드 16장)

- FE에서 AI API 직접 호출 금지, AI가 DB 직접 저장 금지, 사용자 데이터는 인증 사용자 기준.
- AI fallback 응답 필수(데모 안정성). `VITE_` prefix에 비밀값 금지.
- CI 실패 시 main 병합 금지(branch protection으로 강제).
- 코드 변경 사이클마다 Codex 교차검증(메모리 규약 `codex_verification_workflow`).
