# 협업 도구 연동 가이드

## Slack

### 1) CI 결과 알림 (자동, 코드 포함)
`.github/workflows/ci.yml`의 `notify` 잡이 모든 잡 결과를 모아 Slack Incoming Webhook으로 전송한다.

설정:
1. Slack → 대상 채널(예: `#inseoul-dev`)에 **Incoming Webhook** 생성 → URL 복사.
2. GitHub 레포 → Settings → Secrets and variables → Actions → **`SLACK_WEBHOOK_URL`** 등록.
3. 이후 push/PR마다 성공/실패 요약이 채널에 게시된다. (Secret 미설정 시 알림 잡은 조용히 skip)

### 2) GitHub 활동 알림 (앱, 코드 없음)
Slack에서 **GitHub 앱** 설치 후 채널에서:
```
/github subscribe InSeoulProject/InSeoul pulls issues reviews commits
```
PR·이슈·리뷰·푸시 활동이 채널로 들어온다. 필요시 `/github unsubscribe ... commits`로 소음 조절.

### 3) 일일 공유 템플릿
- GitHub Issue 템플릿: `.github/ISSUE_TEMPLATE/daily-share.md`
- 또는 헤르메스 에이전트가 매 평일 자동 다이제스트를 게시 (아래).

## 헤르메스 (PM 에이전트)
`.github/workflows/hermes.yml` — cron(평일 09:00 KST) + 수동 실행(`workflow_dispatch`).
`scripts/hermes`가 GitHub(PR/이슈/CI)·(선택)Jira를 수집해 사내 GMS 프록시(Anthropic 호환,
`claude-sonnet-4-6`)로 요약, Slack에 게시.

필요한 Secrets:
- `GMS_KEY` (필수 — SSAFY GMS 프록시 키, `x-api-key` 로 전송)
- `SLACK_WEBHOOK_URL` (필수, CI 알림과 공용)
- `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN` (선택 — 헤르메스가 Jira를 *읽을* 때만)

엔드포인트 기본값: `https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages` (스크립트 내장,
`LLM_BASE_URL` env 로 변경 가능).

수동 검증: GitHub → Actions → "Hermes PM digest" → **Run workflow**.

## Jira
[CONTRIBUTING.md](../CONTRIBUTING.md) 참고 — Atlassian GitHub 앱 + Smart Commits.
