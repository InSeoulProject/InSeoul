# Hermes Slack relay (Cloudflare Worker)

Slack `/hermes <요청>` → 이 Worker(서명 검증) → GitHub `repository_dispatch` →
Actions `hermes-command.yml` → `scripts/hermes/command.mjs`(LLM tool-use) → Jira 조작 →
Slack `response_url`로 결과 회신.

상시 서버 없이 **무료 서버리스** 한 조각만 둡니다.

## 흐름
```
Slack /hermes  ──POST──▶  Worker(검증)  ──dispatch──▶  GitHub Actions  ──▶ Jira
     ▲                                                      │
     └──────────────── response_url 회신 ───────────────────┘
```

## 1) GitHub PAT 발급 (dispatch용)
- https://github.com/settings/personal-access-tokens → **Fine-grained token**
- Resource owner: `InSeoulProject`, Repository: `InSeoul`
- Permissions → **Contents: Read and write** (repository_dispatch 발화에 필요) 또는 최소 **Contents: Read** + **Actions: Read/Write**
- 토큰 복사 (`github_pat_...`)

## 2) Worker 배포 (Cloudflare, 무료)
```bash
npm i -g wrangler          # 또는 npx 사용
cd infra/slack-relay
wrangler login             # 브라우저 인증
wrangler secret put SLACK_SIGNING_SECRET   # (3)에서 복사한 값 붙여넣기
wrangler secret put GH_TOKEN               # (1)의 PAT
wrangler deploy
# 출력된 URL 복사: https://hermes-slack-relay.<account>.workers.dev
```
> `GH_REPO`는 wrangler.toml의 var로 이미 `InSeoulProject/InSeoul`.

## 3) Slack 앱 — 슬래시 커맨드
- https://api.slack.com/apps → 기존 `InSeoul CI` 앱(또는 새 앱) 선택
- **Slash Commands → Create New Command**
  - Command: `/hermes`
  - Request URL: (2)에서 배포된 Worker URL
  - Short description: `헤르메스에게 Jira 작업 요청`
  - Usage hint: `로그인 API 작업 만들어서 함동균한테 배정해줘`
- **Basic Information → App Credentials → Signing Secret** 복사 → (2)의 `SLACK_SIGNING_SECRET`
- 앱을 워크스페이스에 (재)설치하여 슬래시 커맨드 활성화
- 사용할 채널에 앱 추가(`/invite @InSeoul CI`)

## 4) 사용
채널에서:
```
/hermes 로그인 API 작업 만들어서 함동균한테 배정해줘
/hermes 내 진행중 작업 보여줘
/hermes NSLPRJCT-5 완료로 옮겨줘
```
헤르메스가 의도를 해석해 Jira에 반영하고 결과를 채널에 회신합니다.

## 필요 권한/시크릿 요약
| 위치 | 값 |
|---|---|
| Cloudflare Worker secret | `SLACK_SIGNING_SECRET`, `GH_TOKEN` |
| Cloudflare Worker var | `GH_REPO` (toml에 설정됨) |
| GitHub repo secret (Actions가 사용) | `GMS_KEY`, `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN` (이미 등록) |

## 동작/제약
- 슬래시 커맨드는 3초 내 ack가 필요해 Worker는 즉시 "처리 중" 응답 → 실제 결과는 `response_url`로 후속 회신(30분/5회 유효).
- 파괴적 작업(삭제)은 command.mjs가 도구로 제공하지 않음(생성/배정/전환/검색만).
- LLM은 `claude-sonnet-4-6`(GMS 프록시) tool-use.
