# ADR-0001: 모노레포 구조 및 다언어 빌드

- 상태: 채택
- 날짜: 2026-06-22

## 맥락
2인 팀이 FE(React/Vite), BE(Spring Boot/Java 21), AI(FastAPI/Python)를 API 계약으로 분리해
운영한다. 버전1(`tpals0409/In-Seoul`, 단일 Vite 앱)은 레퍼런스로만 두고 신규 레포에서 시작.

## 결정
- 단일 레포에 `apps/{web,api,ai}` + `packages/{shared-contracts,data,calculation}`.
- JS 패키지(web, packages/*)는 **npm workspaces**로 묶는다.
- `apps/api`는 Gradle, `apps/ai`는 pip — 각자 툴체인으로 독립 빌드.
- `packages/shared-contracts`(TypeScript)가 API 계약의 단일 소스. Java/Python은 이를 참조 규약으로
  수동 동기화(MVP). 계약 변경 시 Slack 공유 후 이 패키지부터 수정.
- CI는 `dorny/paths-filter`로 변경 범위별 잡 분리.

## 결과
- 언어별 독립성 유지하면서 계약을 한 곳에서 관리.
- 로컬 JDK(이 PC는 25)와 무관하게 Gradle toolchain이 Java 21을 프로비저닝.
- 로컬 Python이 3.11 미만이면 `apps/ai`는 CI(3.11)에서 검증.
