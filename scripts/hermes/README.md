# 헤르메스 — PM 에이전트

GitHub Actions cron(`.github/workflows/hermes.yml`)에서 실행되는 PM 다이제스트 에이전트.
**서버·각 PC 설치 불필요** — GitHub 클라우드 러너에서 동작한다.

## 동작
1. GitHub REST로 최근 24h 머지 PR / 열린 PR(이슈키 누락 감지) / 실패한 CI를 수집.
2. 사내 GMS 프록시(Anthropic 호환, `claude-sonnet-4-6`)로 한국어 다이제스트 요약.
3. Slack(`SLACK_WEBHOOK_URL`)에 게시.

`GMS_KEY` 미설정 시 기계 생성 요약으로 fallback. `SLACK_WEBHOOK_URL` 미설정 시 로그 출력.

## 필요한 Secrets (레포 Settings → Secrets → Actions)
- `GMS_KEY` (요약 — SSAFY GMS 프록시 키. `x-api-key` 로 전송)
- `SLACK_WEBHOOK_URL` (게시, CI 알림과 공용)
- `GITHUB_TOKEN`은 Actions가 자동 제공
- **Jira 쓰기(이슈 자동 생성)용 — 셋 다 있어야 활성:**
  - `JIRA_BASE_URL` (예: `https://yoursite.atlassian.net`)
  - `JIRA_USER_EMAIL` (토큰 발급 계정 이메일)
  - `JIRA_API_TOKEN` (https://id.atlassian.com/manage-profile/security/api-tokens)

## Jira 블로커 자동 생성 (규칙 A)
- **현재** main CI가 실패(최신 main CI 런 기준)면 `NSLPRJCT`에 `label: ci-blocker` Task 생성.
- **중복 방지**: 열린 `ci-blocker` 이슈가 이미 있으면 재생성 안 함.
- 검증: Actions → Hermes → **Run workflow** → `force_ci_issue` 체크 → `[TEST] ...` 이슈(`label: hermes-test`) 1개 생성됨(중복검사 우회).
- Jira 자격증명 미설정 시 이 기능은 조용히 skip(다이제스트는 정상 동작).

엔드포인트 기본값은 `https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages` (스크립트 내장).
바뀌면 `LLM_BASE_URL` env 로 덮어쓴다. 공개 Anthropic API를 쓰려면 `ANTHROPIC_API_KEY` + `LLM_BASE_URL=https://api.anthropic.com/v1/messages`.

## 수동 실행 / 검증
GitHub → Actions → **Hermes PM digest** → Run workflow.

## L1 — 백로그 시딩 + 자동 배정 + 개인 업무 다이제스트
자율성 **C(하이브리드)**: 상태 동기화는 자동, 생성/배정은 흔적(라벨) + dry-run.

### 설정: `team.json`
두 사람의 식별자를 채우면 기능이 켜집니다 (아는 만큼만):
- `jiraEmail` → **자동 배정** + 개인 다이제스트 (필수)
- `slackMemberId`(`U…`) → Slack **@멘션** (없으면 이름)
- `areas` / `areaToMember` → 영역(web/api/ai/data/ci...) → 담당자 매핑

### 백로그 시딩 (`seed-backlog.mjs`)
가이드 12·14장 Epic/Task를 `backlog.json` 기준으로 Jira에 생성 + 영역별 배정.
- **dry-run 기본**: Actions → **Hermes seed backlog** → Run (apply 미체크) → 생성 *예정* 목록을 Slack에 제안
- **적용**: 같은 워크플로 → **apply 체크** → 실제 생성 (label `seed`, 중복 방지)

### 개인 업무 다이제스트
매일 다이제스트 끝에 `assignee` 기준으로 **사람별 진행 중 작업**을 @멘션과 함께 게시.

## 대화형 명령 (Slack `/hermes`)
Slack에서 자연어로 작업 요청 → 헤르메스(LLM tool-use)가 Jira에 반영 → 채널 회신.
경로: Slack → Cloudflare Worker(`infra/slack-relay`) → GitHub `repository_dispatch`
→ `hermes-command.yml` → `command.mjs`. 배포/설정은 `infra/slack-relay/README.md`.
```
/hermes 로그인 API 작업 만들어서 함동균한테 배정해줘
/hermes 내 진행중 작업 보여줘
/hermes NSLPRJCT-5 완료로 옮겨줘
```
도구: search_issues / create_issue / assign_issue / transition_issue (삭제 없음).

## 로드맵
1. ✅ 일일 다이제스트
2. ✅ Jira 블로커 자동 생성 (규칙 A — main CI 실패, 중복 방지)
3. ✅ L1: 백로그 시딩 + 자동 배정 + 개인 다이제스트
4. ✅ 대화형 Slack 명령 (`/hermes`, LLM tool-use)
5. L2: PR/CI 신호 → 칸반 상태 자동 동기화 (PR 머지→완료 등)
6. L3: 우선순위/작업순서 제안 (Slack 승인 → 랭킹 API)

심층·대화형 PM 작업은 cron과 별개로 로컬 `/hermes`(tmux 멀티에이전트)로 병행 가능.
