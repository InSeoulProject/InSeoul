# 기여 가이드

## 브랜치 & PR
- `main`은 보호 브랜치다. 직접 push 금지, **PR + CI 통과 필수**, CI 실패 시 머지 금지.
- 브랜치: `feature/<area>-<issueKey>-<slug>` (예: `feature/api-TPALS-12-auth`). area ∈ web/api/ai/data/ci.
- PR 제목에 Jira 이슈키를 포함한다 (예: `TPALS-12 feat(api): signup endpoint`).

## Jira 연동 (Atlassian GitHub 앱 + Smart Commits)

- **프로젝트 키: `TPALS`** (이슈는 `TPALS-1`, `TPALS-2` ...)

조직 admin이 Jira에서 **"GitHub for Jira"** 앱을 설치하고 `InSeoulProject/InSeoul` 레포를 연결한다.
연결 후에는 커밋/PR/브랜치에 이슈키를 넣기만 하면 Jira 이슈에 자동으로 링크·반영된다.

### Smart Commit 문법
커밋 메시지에 이슈키 + 명령을 넣는다:
```
TPALS-12 feat(api): add login endpoint     # 이슈에 커밋 링크
TPALS-12 #comment 로그인 검증 로직 추가      # 이슈에 코멘트
TPALS-12 #in-progress                       # 상태 전환(진행 중)
TPALS-12 #done                              # 상태 전환(완료)
TPALS-12 #time 2h 회원가입 구현             # 작업 시간 기록
```
- 이슈키는 메시지 어디에 있어도 인식되지만, 맨 앞 권장.
- 전환 명령(`#in-progress`, `#done` 등)의 이름은 해당 Jira 프로젝트의 워크플로 전환명과 일치해야 한다.

### Jira Epic (가이드 12장 — 수동 생성)
```
EPIC-01 기획/설계        EPIC-06 AI API
EPIC-02 모노레포 구조     EPIC-07 Data/Calculation
EPIC-03 인증/사용자 DB    EPIC-08 CI/CD
EPIC-04 Front-end        EPIC-09 통합/QA
EPIC-05 Back-end API     EPIC-10 발표/제출
```

## 계약(Contracts) 변경 규칙
`packages/shared-contracts`의 API DTO를 바꾸면:
1. 먼저 Slack 공유 채널에 변경 내용을 알린다.
2. `shared-contracts`를 수정·빌드한다.
3. 그 다음 web/api/ai를 맞춘다.

## 일일 공유 (가이드 13장)
작업 시작/종료 시 Slack에 공유한다:
```text
[InSeoul 작업 공유]
담당자:
오늘 목표:
완료:
블로커:
API/계약 변경 여부:
다음 작업:
```
이 포맷은 헤르메스 에이전트가 자동 취합한다.

## 커밋 메시지 컨벤션
`<issueKey> <type>(<scope>): <subject>` — type ∈ feat/fix/docs/chore/refactor/test/ci.
