# 05 API 설계서

> Notion page id: `3870b460-8674-81ca-bd6d-f0484c260a4b`
> Source: 

---

# InSeoul API 설계서
## 1. 설계 전제
수정 반영: 로그인 기능과 사용자별 서버 DB 저장을 포함합니다. 인증이 필요한 API는 `Authorization: Bearer {accessToken}` 헤더를 사용합니다.
<table header-row="true">
<tr>
<td>담당</td>
<td>책임</td>
</tr>
<tr>
<td>함동균</td>
<td>인증/API 엔드포인트/프론트 연동 구현</td>
</tr>
<tr>
<td>김세민</td>
<td>AI/Data 요청·응답 필드 및 계산 기준 검토</td>
</tr>
</table>
## 2. API 목록
<table header-row="true">
<tr>
<td>Method</td>
<td>URL</td>
<td>설명</td>
<td>인증</td>
<td>우선순위</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/auth/signup`</td>
<td>회원가입</td>
<td>공개</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/auth/login`</td>
<td>로그인</td>
<td>공개</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/auth/logout`</td>
<td>로그아웃</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/auth/refresh`</td>
<td>토큰 갱신</td>
<td>refresh 필요</td>
<td>P2</td>
</tr>
<tr>
<td>GET</td>
<td>`/api/users/me`</td>
<td>내 사용자 정보 조회</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>PUT</td>
<td>`/api/users/me/profile`</td>
<td>내 재무 프로필 저장</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>GET</td>
<td>`/api/users/me/profile`</td>
<td>내 재무 프로필 조회</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>GET</td>
<td>`/api/districts/prices`</td>
<td>지역별 가격 데이터 조회</td>
<td>공개</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/parse-input`</td>
<td>자연어 입력 구조화</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/simulation/golden-cross`</td>
<td>매수 D-Day 계산 및 저장</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>GET</td>
<td>`/api/simulation/history`</td>
<td>내 시뮬레이션 이력 조회</td>
<td>필요</td>
<td>P2</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/simulation/stress-test`</td>
<td>스트레스 테스트 계산</td>
<td>필요</td>
<td>P1</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/loans/eligibility`</td>
<td>정책대출 적격성 판정</td>
<td>필요</td>
<td>P2</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/ai/strategy-card`</td>
<td>AI 전략 카드 생성 및 저장</td>
<td>필요</td>
<td>P1</td>
</tr>
</table>
## 3. 인증 API
### POST `/api/auth/signup`
```json
{
  "email": "user@example.com",
  "password": "password1234",
  "nickname": "서울러"
}
```
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "nickname": "서울러" },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```
### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "nickname": "서울러" },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```
## 4. 사용자 프로필 API
### PUT `/api/users/me/profile`
```json
{
  "cashAsset": 30000000,
  "jeonseDeposit": 200000000,
  "monthlySaving": 1500000,
  "annualIncome": 50000000,
  "firstHomeBuyer": true,
  "maritalStatus": "single"
}
```
## 5. GET `/api/districts/prices`
```json
{
  "success": true,
  "data": [
    {
      "district": "마포구",
      "averagePrice": 900000000,
      "jeonsePrice": 500000000,
      "baseDate": "2026-06-01"
    }
  ]
}
```
## 6. POST `/api/parse-input`
```json
{
  "text": "전세 보증금 2억 있고 현금은 3천 있어. 월 150 저축 가능하고 마포구를 보고 있어."
}
```
```json
{
  "success": true,
  "data": {
    "cashAsset": 30000000,
    "jeonseDeposit": 200000000,
    "monthlySaving": 1500000,
    "annualIncome": null,
    "targetDistrict": "마포구",
    "targetPrice": null,
    "missingFields": ["annualIncome", "firstHomeBuyer", "targetPrice"]
  }
}
```
## 7. POST `/api/simulation/golden-cross`
요청 성공 시 결과를 로그인 사용자 기준으로 `simulations`에 저장합니다.
```json
{
  "cashAsset": 30000000,
  "jeonseDeposit": 200000000,
  "monthlySaving": 1500000,
  "targetDistrict": "마포구",
  "targetPrice": 900000000,
  "ltv": 0.7,
  "interestRate": 0.04,
  "expectedGrowthRate": 0.03,
  "acquisitionTaxRate": 0.011
}
```
```json
{
  "success": true,
  "data": {
    "simulationId": 101,
    "dDayMonths": 36,
    "requiredCapital": 285000000,
    "availableAsset": 287500000,
    "targetPriceAtPurchase": 982000000,
    "message": "현재 조건 기준 약 36개월 뒤 매수 가능성이 있습니다."
  }
}
```
## 8. GET `/api/simulation/history`
로그인 사용자의 시뮬레이션 이력만 반환합니다.
```json
{
  "success": true,
  "data": [
    {
      "simulationId": 101,
      "targetDistrict": "마포구",
      "dDayMonths": 36,
      "createdAt": "2026-06-22T10:00:00"
    }
  ]
}
```
## 9. POST `/api/ai/strategy-card`
```json
{
  "simulationId": 101,
  "simulationResult": {
    "dDayMonths": 36,
    "requiredCapital": 285000000,
    "targetDistrict": "마포구"
  },
  "stressTestResults": [
    { "scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5 }
  ],
  "loanResults": [
    { "loanName": "보금자리론", "status": "POSSIBLE", "reason": "소득 조건 충족 가능성이 있습니다." }
  ]
}
```
```json
{
  "success": true,
  "data": {
    "strategyCardId": 501,
    "summary": "현재 조건에서는 마포구 매수 가능 시점이 약 36개월 뒤입니다.",
    "actionItems": [
      "월 저축액을 30만 원 늘리면 D-Day 단축 가능성이 있습니다.",
      "보금자리론 주택 가격 한도 확인이 필요합니다.",
      "금리 상승 시 매수 가능 시점이 지연될 수 있습니다."
    ],
    "disclaimer": "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다."
  }
}
```
---
## 10. 모노레포 API 분리 반영
## 10-1. API 계층
<table header-row="true">
<tr>
<td>계층</td>
<td>호출 주체</td>
<td>대상</td>
<td>설명</td>
</tr>
<tr>
<td>외부 API</td>
<td>Front-end</td>
<td>Back-end</td>
<td>사용자가 호출하는 서비스 API</td>
</tr>
<tr>
<td>내부 AI API</td>
<td>Back-end</td>
<td>AI Service</td>
<td>Back-end만 호출하는 AI 기능 API</td>
</tr>
<tr>
<td>공통 계약</td>
<td>FE/BE/AI</td>
<td>shared-contracts</td>
<td>Request/Response 타입 단일 출처</td>
</tr>
</table>
## 10-2. 외부 API — Front-end 호출
<table header-row="true">
<tr>
<td>Method</td>
<td>Endpoint</td>
<td>설명</td>
<td>내부 처리</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/ai/parse-input`</td>
<td>자연어 조건 구조화</td>
<td>Back-end 인증 확인 후 `/internal/ai/parse-input` 호출</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/ai/strategy-card`</td>
<td>AI 전략 카드 생성 및 저장</td>
<td>simulation 소유권 확인 후 `/internal/ai/strategy-card` 호출, 결과 DB 저장</td>
</tr>
<tr>
<td>POST</td>
<td>`/api/ai/policy-explain`</td>
<td>정책 조건 설명</td>
<td>정책 데이터 결합 후 `/internal/ai/policy-explain` 호출</td>
</tr>
</table>
## 10-3. 내부 AI API — Back-end 전용
### POST `/internal/ai/parse-input`
Request:
```json
{
  "text": "전세 보증금 2억 있고 현금은 3천 있어. 월 150 저축 가능하고 마포구를 보고 있어.",
  "locale": "ko-KR"
}
```
Response:
```json
{
  "cashAsset": 30000000,
  "jeonseDeposit": 200000000,
  "monthlySaving": 1500000,
  "annualIncome": null,
  "targetDistrict": "마포구",
  "targetPrice": null,
  "missingFields": ["annualIncome", "firstHomeBuyer", "targetPrice"],
  "confidence": 0.86
}
```
### POST `/internal/ai/strategy-card`
Request:
```json
{
  "simulationResult": {
    "dDayMonths": 36,
    "requiredCapital": 285000000,
    "targetDistrict": "마포구"
  },
  "stressTestResults": [
    { "scenarioType": "INTEREST_RATE_UP", "delayedMonths": 5 }
  ],
  "loanResults": [
    { "loanName": "보금자리론", "status": "POSSIBLE", "reason": "소득 조건 충족 가능성이 있습니다." }
  ],
  "guardrail": {
    "forbidGuarantee": true,
    "includeDisclaimer": true
  }
}
```
Response:
```json
{
  "summary": "현재 조건에서는 마포구 매수 가능 시점이 약 36개월 뒤입니다.",
  "actionItems": [
    "월 저축액을 30만 원 늘리면 D-Day 단축 가능성이 있습니다.",
    "보금자리론 주택 가격 한도 확인이 필요합니다.",
    "금리 상승 시 매수 가능 시점이 지연될 수 있습니다."
  ],
  "riskNotes": [
    "본 결과는 입력값 기반 시뮬레이션이며 실제 대출 승인이나 매수를 보장하지 않습니다."
  ],
  "disclaimer": "본 서비스는 정보 제공 목적이며 금융·부동산 의사결정을 보장하지 않습니다."
}
```
## 10-4. Back-end 중계 규칙
- Front-end는 `/internal/ai/*`를 직접 호출하지 않는다.
- Back-end는 AI API 호출 전 인증과 데이터 소유권을 검증한다.
- AI API 응답은 Back-end가 검증/가공 후 사용자별 DB에 저장한다.
- AI API 실패 시 Back-end는 fallback 응답을 반환한다.
