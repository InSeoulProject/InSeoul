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

엔드포인트 기본값은 `https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages` (스크립트 내장).
바뀌면 `LLM_BASE_URL` env 로 덮어쓴다. 공개 Anthropic API를 쓰려면 `ANTHROPIC_API_KEY` + `LLM_BASE_URL=https://api.anthropic.com/v1/messages`.

## 수동 실행 / 검증
GitHub → Actions → **Hermes PM digest** → Run workflow.

## 로드맵 (단계적 확장)
1. ✅ 일일 다이제스트
2. Jira 동기화 보조 (이슈키 누락 PR 코멘트, Epic 진행률) — `JIRA_*` read 토큰 필요
3. 릴리스/제출 노트 (main 머지 변경 모음)
4. 블로커/스탠드업 취합 (가이드 13장 포맷)

심층·대화형 PM 작업은 cron과 별개로 로컬 `/hermes`(tmux 멀티에이전트)로 병행 가능.
