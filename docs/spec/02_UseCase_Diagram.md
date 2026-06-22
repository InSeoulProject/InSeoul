# 02 UseCase Diagram

> Notion page id: `3870b460-8674-811b-ab9e-d5496d5af9eb`
> Source: 

---

# InSeoul UseCase Diagram
## 1. Actor 정의
<table header-row="true">
<tr>
<td>Actor</td>
<td>설명</td>
</tr>
<tr>
<td>사용자</td>
<td>서울 내 집 마련을 준비하는 청년/신혼부부/첫 주택 구매 예정자</td>
</tr>
<tr>
<td>인증 시스템</td>
<td>회원가입, 로그인, 로그아웃, 토큰 검증을 담당</td>
</tr>
<tr>
<td>서버 DB</td>
<td>사용자 계정, 사용자별 프로필, 시뮬레이션, AI 전략 카드 데이터를 저장</td>
</tr>
<tr>
<td>AI 서비스</td>
<td>자연어 조건 파싱, AI 전략 카드 생성, 정책 설명을 수행하는 LLM/RAG 기능</td>
</tr>
<tr>
<td>지역/정책 데이터</td>
<td>서울 자치구 가격 데이터와 정책대출 조건 데이터</td>
</tr>
<tr>
<td>CI/CD 시스템</td>
<td>GitHub Actions 등 자동 검증/배포 파이프라인</td>
</tr>
<tr>
<td>협업 도구</td>
<td>Jira, Slack을 통한 작업/커뮤니케이션 관리</td>
</tr>
</table>
## 2. Use Case 목록
<table header-row="true">
<tr>
<td>ID</td>
<td>Use Case</td>
<td>Actor</td>
<td>설명</td>
</tr>
<tr>
<td>UC-01</td>
<td>회원가입하기</td>
<td>사용자/인증 시스템</td>
<td>사용자가 계정을 생성한다</td>
</tr>
<tr>
<td>UC-02</td>
<td>로그인하기</td>
<td>사용자/인증 시스템</td>
<td>사용자가 인증 후 서비스를 이용한다</td>
</tr>
<tr>
<td>UC-03</td>
<td>로그아웃하기</td>
<td>사용자/인증 시스템</td>
<td>사용자가 인증 상태를 종료한다</td>
</tr>
<tr>
<td>UC-04</td>
<td>사용자별 데이터 저장하기</td>
<td>서버 DB</td>
<td>입력값, 시뮬레이션, AI 전략 카드를 user_id 기준으로 저장한다</td>
</tr>
<tr>
<td>UC-05</td>
<td>조건 입력하기</td>
<td>사용자</td>
<td>재무 조건과 목표 지역을 수동 입력한다</td>
</tr>
<tr>
<td>UC-06</td>
<td>자연어 조건 입력하기</td>
<td>사용자</td>
<td>자연어로 현재 상황을 입력한다</td>
</tr>
<tr>
<td>UC-07</td>
<td>자연어 조건 분석하기</td>
<td>AI 서비스</td>
<td>자연어를 구조화된 입력값으로 변환한다</td>
</tr>
<tr>
<td>UC-08</td>
<td>지역 가격 조회하기</td>
<td>지역/정책 데이터</td>
<td>목표 지역의 가격 데이터를 조회한다</td>
</tr>
<tr>
<td>UC-09</td>
<td>매수 D-Day 계산하기</td>
<td>사용자</td>
<td>매수 가능 시점을 계산한다</td>
</tr>
<tr>
<td>UC-10</td>
<td>스트레스 테스트 확인하기</td>
<td>사용자</td>
<td>금리/집값/저축 변화별 D-Day 변화를 확인한다</td>
</tr>
<tr>
<td>UC-11</td>
<td>정책대출 적격성 확인하기</td>
<td>사용자</td>
<td>정책대출 가능성을 확인한다</td>
</tr>
<tr>
<td>UC-12</td>
<td>AI 전략 카드 확인하기</td>
<td>사용자</td>
<td>계산 결과 기반 행동 전략을 확인한다</td>
</tr>
<tr>
<td>UC-13</td>
<td>결과 이력 조회하기</td>
<td>사용자/서버 DB</td>
<td>사용자가 본인의 과거 시뮬레이션 결과를 조회한다</td>
</tr>
<tr>
<td>UC-14</td>
<td>CI 검증 실행하기</td>
<td>CI/CD 시스템</td>
<td>코드 변경 시 lint/test/build를 자동 실행한다</td>
</tr>
</table>
## 3. PlantUML
```mermaid
@startuml
left to right direction

actor "사용자" as User
actor "인증 시스템" as Auth
actor "서버 DB" as DB
actor "AI 서비스" as AI
actor "지역/정책 데이터" as Data
actor "CI/CD 시스템" as CI

rectangle "InSeoul" {
  usecase "회원가입하기" as UC1
  usecase "로그인하기" as UC2
  usecase "로그아웃하기" as UC3
  usecase "사용자별 데이터 저장하기" as UC4
  usecase "조건 입력하기" as UC5
  usecase "자연어 조건 입력하기" as UC6
  usecase "자연어 조건 분석하기" as UC7
  usecase "지역 가격 조회하기" as UC8
  usecase "매수 D-Day 계산하기" as UC9
  usecase "스트레스 테스트 확인하기" as UC10
  usecase "정책대출 적격성 확인하기" as UC11
  usecase "AI 전략 카드 확인하기" as UC12
  usecase "결과 이력 조회하기" as UC13
  usecase "CI 검증 실행하기" as UC14
}

User --> UC1
User --> UC2
User --> UC3
User --> UC5
User --> UC6
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13

UC1 --> Auth
UC2 --> Auth
UC3 --> Auth
UC4 --> DB
UC5 --> UC4 : <<include>>
UC6 --> UC7 : <<include>>
UC7 --> AI
UC9 --> UC8 : <<include>>
UC9 --> UC4 : <<include>>
UC10 --> UC9 : <<include>>
UC11 --> Data
UC12 --> AI
UC12 --> UC4 : <<include>>
UC13 --> DB
UC8 --> Data
CI --> UC14
@enduml
```
---
## 4. 모노레포 API 분리 반영 UseCase
### 추가 Actor
<table header-row="true">
<tr>
<td>Actor</td>
<td>설명</td>
</tr>
<tr>
<td>Front-end App</td>
<td>사용자 화면과 입력을 담당하며 Back-end API만 호출</td>
</tr>
<tr>
<td>Back-end API</td>
<td>인증, 사용자별 DB 저장, 계산, AI API 중계를 담당</td>
</tr>
<tr>
<td>Internal AI API</td>
<td>자연어 파싱, 전략 카드 생성, 정책 설명을 담당</td>
</tr>
<tr>
<td>Shared Contracts</td>
<td>FE/BE/AI가 공유하는 Request/Response 타입</td>
</tr>
</table>
### 추가 PlantUML
```javascript
@startuml
left to right direction
actor "사용자" as User
rectangle "apps/web\nFront-end" as Web
rectangle "apps/api\nBack-end API" as Api
rectangle "apps/ai\nInternal AI API" as Ai
rectangle "Server DB" as DB
rectangle "packages/shared-contracts" as Contracts

User --> Web : 화면 입력
Web --> Api : 외부 API 호출\nBearer Token + JSON
Api --> DB : 사용자별 데이터 저장/조회
Api --> Ai : /internal/ai/* 호출
Api --> Contracts : DTO 참조
Web --> Contracts : DTO 참조
Ai --> Contracts : DTO 참조
@enduml
```
### 원칙
- 사용자는 Front-end만 직접 사용한다.
- Front-end는 Back-end API만 호출한다.
- Back-end는 인증과 사용자별 데이터 소유권을 확인한 뒤 Internal AI API를 호출한다.
- AI API는 DB를 직접 수정하지 않고 구조화 결과/전략 카드 JSON을 반환한다.
