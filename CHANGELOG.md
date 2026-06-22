# Changelog

## [Unreleased]

### Added
- 모노레포 부트스트랩 (apps/web·api·ai, packages/shared-contracts·data·calculation)
- GitHub Actions CI (path-filter) + Slack 통합 알림
- 헤르메스 PM 에이전트: 일일 다이제스트, Jira 블로커 자동 생성, 백로그 시딩/배정, 대화형 `/hermes` 명령
- Jira(GitHub for Jira 앱 + Smart Commits, 키 `NSLPRJCT`) / Slack 연동
- 기획·요구사항 스펙 문서 (`docs/spec/`)

### Changed
- 요구사항/API 설계서/ERD(`docs/spec/`)에 맞춰 정합:
  - `shared-contracts`: `{success,data}` 응답 래퍼, 실제 필드/엔드포인트
  - `apps/api`: ERD 기준 `V1__init.sql`, 13개 엔드포인트 컨트롤러 스텁
  - `apps/ai`: 내부 AI API 계약(parse-input/strategy-card/policy-explain)
  - `packages/calculation`: 골든크로스 D-Day 공식
  - `backlog.json`: WBS 8 Epic + 작업별 담당 영역
