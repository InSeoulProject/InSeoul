# 00 InSeoul 기획서

> Notion page id: `3870b460-8674-81e4-b596-cd2020c42691`
> Source: 

---

## 전세에서 내 집까지, 데이터로 설계하는 매수 전환 D-Day
> 서울에서 내 집 마련을 고민하는 청년·신혼부부가 감이 아니라 데이터로 매수 전환 시점을 판단하도록 돕는 AI 부동산 전략 시뮬레이터
---
## 1. 기획 배경
서울에서 내 집 마련을 준비하는 사람들은 단순히 “집값이 비싸다”는 문제만 겪는 것이 아닙니다. 더 큰 문제는 **내가 언제, 어느 정도 가격대의 집을 살 수 있는지 판단하기 어렵다**는 점입니다.
사용자는 현재 보유 자산, 전세 보증금, 월 저축 가능액, 목표 지역 주택 가격, LTV·DSR, 정책대출 조건, 금리·집값 상승 리스크를 각각 따로 확인해야 합니다.
**InSeoul**은 이 정보들을 하나로 연결해 **매수 가능 시점**, **정책대출 가능성**, **리스크 변화**, **AI 전략 카드**를 한 화면에서 제공합니다.
---
## 2. 문제 정의
### 핵심 문제
> 서울 내 집 마련을 준비하는 사용자는 “집값”보다 먼저 **내가 언제 살 수 있는지**를 모릅니다.
<table header-row="true">
<tr>
<td>문제</td>
<td>설명</td>
</tr>
<tr>
<td>정보 분산</td>
<td>자산, 대출, 정책, 지역 가격 정보를 따로 확인해야 함</td>
</tr>
<tr>
<td>계산 복잡도</td>
<td>LTV, 취득세, 월 저축, 자산 성장 등을 직접 계산하기 어려움</td>
</tr>
<tr>
<td>리스크 인지 부족</td>
<td>금리 상승, 집값 상승, 저축 감소가 매수 시점에 미치는 영향을 체감하기 어려움</td>
</tr>
<tr>
<td>행동 전략 부재</td>
<td>계산 결과를 봐도 지금 무엇을 해야 할지 알기 어려움</td>
</tr>
<tr>
<td>AI 활용 한계</td>
<td>기존 챗봇은 일반 조언에 머물고, 개인 조건 기반 전략 제시는 약함</td>
</tr>
</table>
---
## 3. 목표 사용자
<table header-row="true">
<tr>
<td>사용자 유형</td>
<td>주요 니즈</td>
</tr>
<tr>
<td>서울 전세 거주 청년</td>
<td>전세에서 매수로 전환 가능한 시점 파악</td>
</tr>
<tr>
<td>첫 주택 구매 예정자</td>
<td>현재 자산으로 가능한 가격대와 지역 확인</td>
</tr>
<tr>
<td>신혼부부/예비 신혼부부</td>
<td>정책대출 가능성 및 매수 전략 확인</td>
</tr>
<tr>
<td>부동산 초보자</td>
<td>복잡한 대출·정책·세금 조건을 쉽게 이해</td>
</tr>
<tr>
<td>내 집 마련 계획자</td>
<td>금리/집값 변동에 따른 리스크 확인</td>
</tr>
</table>
---
## 4. 서비스 한 줄 정의
> **InSeoul은 전세 보증금, 현금 자산, 월 저축액, 목표 지역을 입력하면 서울 아파트 매수 가능 시점과 정책대출 전략을 계산해주는 AI 부동산 시뮬레이터입니다.**
---
## 5. 핵심 가치 제안
<table header-row="true">
<tr>
<td>가치</td>
<td>설명</td>
</tr>
<tr>
<td>매수 가능 시점 계산</td>
<td>사용자의 자산 성장선과 필요 자기자본이 만나는 D-Day 계산</td>
</tr>
<tr>
<td>정책대출 적격성 확인</td>
<td>보금자리론, 디딤돌대출 등 조건 기반 가능성 판정</td>
</tr>
<tr>
<td>리스크 시나리오 분석</td>
<td>금리 상승, 집값 상승, 저축 감소에 따른 D-Day 변화 확인</td>
</tr>
<tr>
<td>AI 전략 카드</td>
<td>계산 결과를 사용자가 이해할 수 있는 행동 전략으로 변환</td>
</tr>
<tr>
<td>대화형 조건 입력</td>
<td>복잡한 폼 대신 자연어로 조건 입력 가능</td>
</tr>
</table>
---
## 6. 핵심 컨셉 — 매수 전환 골든크로스
사용자의 자산은 매월 저축과 수익률에 따라 증가하고, 목표 주택의 필요 자기자본은 주택 가격과 대출 조건에 따라 결정됩니다. 두 선이 만나는 시점이 **매수 전환 가능 시점**입니다.
```plain text
자산 성장선 A(t)
    ↑
    │             /
    │           /
    │         /       ← 보유 자산 + 월 저축
    │       /
    │     /
    │   /________________ 필요 자기자본선 P(t)
    │
    └────────────────────────→ 시간

교차 지점 = 매수 가능 D-Day
```
### 기본 계산식
```plain text
자산 A(t)
= 현재자산 × (1 + 월수익률)^t
+ 월저축 × ((1 + 월수익률)^t - 1) / 월수익률

목표 주택 가격 P(t)
= 현재 목표가 × (1 + 연간상승률)^(t/12)

필요 자기자본
= P(t) × (1 - LTV) + 취득세 및 부대비용

골든크로스
= A(t) ≥ 필요 자기자본을 만족하는 최소 t
```
---
## 7. 주요 기능
### 7-1. 대화형 조건 입력
사용자는 복잡한 입력 폼 대신 자연어로 현재 상황을 입력할 수 있습니다.
**입력 예시**
```plain text
전세 보증금 2억 있고, 현금은 3천만 원 정도 있어.
월 150만 원 저축 가능하고, 마포나 성동 쪽 5억대 아파트를 보고 있어.
```
**AI 구조화 결과**
<table>
<tr>
<td>항목</td>
<td>추출값</td>
</tr>
<tr>
<td>---</td>
<td>---:</td>
</tr>
<tr>
<td>전세 보증금</td>
<td>200,000,000원</td>
</tr>
<tr>
<td>현금 자산</td>
<td>30,000,000원</td>
</tr>
<tr>
<td>월 저축액</td>
<td>1,500,000원</td>
</tr>
<tr>
<td>희망 지역</td>
<td>마포구, 성동구</td>
</tr>
<tr>
<td>목표 가격</td>
<td>500,000,000원</td>
</tr>
</table>
---
### 7-2. 매수 D-Day 계산
사용자의 현재 자산과 월 저축액을 바탕으로 목표 주택 매수 가능 시점을 계산합니다.
<table header-row="true">
<tr>
<td>계산 요소</td>
<td>설명</td>
</tr>
<tr>
<td>현금 자산</td>
<td>현재 보유 현금</td>
</tr>
<tr>
<td>전세 보증금</td>
<td>매수 시 활용 가능한 주거 자산</td>
</tr>
<tr>
<td>월 저축액</td>
<td>매월 추가되는 자산</td>
</tr>
<tr>
<td>목표 주택 가격</td>
<td>지역별 평균 또는 사용자가 입력한 목표 가격</td>
</tr>
<tr>
<td>LTV</td>
<td>대출 가능 비율</td>
</tr>
<tr>
<td>취득세/부대비용</td>
<td>매수 시 필요한 추가 비용</td>
</tr>
<tr>
<td>연간 가격 상승률</td>
<td>주택 가격 상승 시나리오</td>
</tr>
</table>
---
### 7-3. 정책대출 적격성 판정
사용자의 조건을 바탕으로 주요 정책대출 가능성을 판정합니다.
<table header-row="true">
<tr>
<td>정책</td>
<td>판정 기준 예시</td>
</tr>
<tr>
<td>보금자리론</td>
<td>주택 가격, 소득, 무주택 여부</td>
</tr>
<tr>
<td>디딤돌대출</td>
<td>생애최초, 부부합산소득, 주택 가격</td>
</tr>
<tr>
<td>청년 전세자금대출</td>
<td>나이, 소득, 보증금 기준</td>
</tr>
<tr>
<td>신혼부부 대출</td>
<td>혼인 여부, 소득, 주택 가격</td>
</tr>
</table>
**출력 예시**
```plain text
보금자리론: 가능성 있음
- 소득 조건은 충족 가능성이 있습니다.
- 단, 목표 주택 가격이 한도에 가까워 지역 조정이 필요할 수 있습니다.

디딤돌대출: 추가 정보 필요
- 생애최초 여부와 세대주 조건 확인이 필요합니다.
```
---
### 7-4. 리스크 스트레스 테스트
금리, 집값, 저축액 변화가 매수 가능 시점에 미치는 영향을 계산합니다.
<table header-row="true">
<tr>
<td>시나리오</td>
<td>결과</td>
</tr>
<tr>
<td>기준 시나리오</td>
<td>36개월 뒤 매수 가능</td>
</tr>
<tr>
<td>금리 +1.0%p</td>
<td>D-Day 5개월 지연</td>
</tr>
<tr>
<td>집값 +10%</td>
<td>D-Day 9개월 지연</td>
</tr>
<tr>
<td>월저축 -30만 원</td>
<td>D-Day 11개월 지연</td>
</tr>
<tr>
<td>월저축 +30만 원</td>
<td>D-Day 7개월 단축</td>
</tr>
</table>
---
### 7-5. AI 전략 카드
AI는 계산 결과를 바탕으로 사용자가 바로 이해할 수 있는 전략 카드를 생성합니다.
```plain text
현재 조건에서는 목표 지역 매수 가능 시점이 약 36개월 뒤입니다.

1. 월 저축액을 30만 원 늘리면 D-Day가 약 7개월 단축됩니다.
2. 금리 1%p 상승 시 매수 가능 시점이 5개월 늦어질 수 있습니다.
3. 보금자리론은 가능성이 있으나 목표 주택 가격 한도 확인이 필요합니다.

추천 전략:
현재는 목표 지역을 유지하되, 12개월 동안 저축률을 높이고
정책대출 조건을 먼저 충족하는 방향이 적합합니다.
```
---
### 7-6. 전략 선택 시뮬레이션
AI가 단일 정답을 제시하지 않고, 여러 선택지를 제공합니다.
<table header-row="true">
<tr>
<td>전략</td>
<td>설명</td>
<td>예상 효과</td>
</tr>
<tr>
<td>빠른 매수 전략</td>
<td>목표 지역/가격을 낮춤</td>
<td>D-Day 단축</td>
</tr>
<tr>
<td>안정 준비 전략</td>
<td>현재 목표 유지, 저축액 증대</td>
<td>리스크 완화</td>
</tr>
<tr>
<td>정책대출 우선 전략</td>
<td>대출 조건 충족 중심 준비</td>
<td>초기 자기자본 부담 감소</td>
</tr>
<tr>
<td>갈아타기 전략</td>
<td>1차 매수 후 목표 지역 이동</td>
<td>장기 전략 가능</td>
</tr>
</table>
> AI는 구매를 단정하지 않고, 사용자가 판단할 수 있는 선택지를 제시합니다.
---
## 8. AI 기능 설계
InSeoul에서 AI는 부동산 가격을 예측하거나 구매를 단정하지 않습니다. AI의 역할은 다음과 같습니다.
```plain text
사용자 조건 이해
→ 계산 가능한 데이터로 변환
→ 계산 결과 해석
→ 정책/대출 조건 설명
→ 리스크 요약
→ 실행 전략 제안
```
<table header-row="true">
<tr>
<td>AI 기능</td>
<td>설명</td>
<td>기술</td>
</tr>
<tr>
<td>자연어 조건 파싱</td>
<td>사용자 입력을 구조화된 재무 데이터로 변환</td>
<td>LLM Function Calling</td>
</tr>
<tr>
<td>정책 근거 설명</td>
<td>정책대출 조건을 사용자 상황에 맞게 설명</td>
<td>RAG</td>
</tr>
<tr>
<td>전략 카드 생성</td>
<td>계산 결과를 행동 전략으로 요약</td>
<td>LLM Summary</td>
</tr>
<tr>
<td>리스크 해석</td>
<td>스트레스 테스트 결과를 쉽게 설명</td>
<td>LLM Reasoning</td>
</tr>
<tr>
<td>추가 질문 생성</td>
<td>부족한 입력값을 질문으로 보완</td>
<td>LLM Prompting</td>
</tr>
</table>
---
## 9. 사용자 경험 흐름
```plain text
1. 사용자가 현재 상황 입력
   예: 전세 2억, 현금 3천, 월저축 150, 마포 희망

2. AI가 입력값 구조화
   전세보증금 / 현금 / 월저축 / 희망지역 / 목표가격 추출

3. 시뮬레이션 엔진 계산
   매수 D-Day / 필요 자기자본 / 대출 가능성 계산

4. 스트레스 테스트 실행
   금리 상승 / 집값 상승 / 저축 변화 시나리오 비교

5. AI 전략 카드 생성
   지금 해야 할 일과 리스크 요약

6. 사용자가 전략 선택
   빠른 매수 / 안정 준비 / 정책대출 우선 / 지역 조정

7. 선택 전략 기준으로 재계산
   D-Day 변화 확인
```
---
## 10. MVP 범위
### 포함
- 사용자 재무 조건 입력
- 자연어 입력 파싱
- 서울 주요 지역 또는 25개구 평균 가격 데이터
- 매수 D-Day 계산
- LTV 기반 필요 자기자본 계산
- 정책대출 가능성 간단 판정
- 금리/집값/저축액 스트레스 테스트
- AI 전략 카드 생성
- 결과 대시보드
### 제외 또는 후순위
- 실시간 실거래가 전체 연동
- OAuth/JWT 기반 회원 시스템
- 장기 사용자 데이터 저장
- 법률/세무 수준의 정밀 조언
- 실제 대출 신청 연동
- 매물 추천/중개 기능
---
## 11. 데이터 설계
### 사용자 입력 데이터
<table header-row="true">
<tr>
<td>필드</td>
<td>설명</td>
</tr>
<tr>
<td>cashAsset</td>
<td>현금 자산</td>
</tr>
<tr>
<td>jeonseDeposit</td>
<td>전세 보증금</td>
</tr>
<tr>
<td>monthlySaving</td>
<td>월 저축액</td>
</tr>
<tr>
<td>annualIncome</td>
<td>연 소득</td>
</tr>
<tr>
<td>maritalStatus</td>
<td>혼인 여부</td>
</tr>
<tr>
<td>firstHomeBuyer</td>
<td>생애최초 여부</td>
</tr>
<tr>
<td>targetDistrict</td>
<td>목표 지역</td>
</tr>
<tr>
<td>targetPrice</td>
<td>목표 주택 가격</td>
</tr>
<tr>
<td>expectedGrowthRate</td>
<td>예상 가격 상승률</td>
</tr>
<tr>
<td>interestRate</td>
<td>예상 금리</td>
</tr>
<tr>
<td>ltv</td>
<td>적용 LTV</td>
</tr>
</table>
### 지역 가격 데이터 예시
<table>
<tr>
<td>지역</td>
<td>평균 가격</td>
</tr>
<tr>
<td>---</td>
<td>---:</td>
</tr>
<tr>
<td>노원구</td>
<td>500,000,000</td>
</tr>
<tr>
<td>도봉구</td>
<td>480,000,000</td>
</tr>
<tr>
<td>강서구</td>
<td>650,000,000</td>
</tr>
<tr>
<td>마포구</td>
<td>900,000,000</td>
</tr>
<tr>
<td>성동구</td>
<td>1,100,000,000</td>
</tr>
<tr>
<td>강남구</td>
<td>2,000,000,000</td>
</tr>
</table>
### 정책 데이터 예시
```json
{
  "name": "보금자리론",
  "maxHousePrice": 600000000,
  "maxIncome": 70000000,
  "ltv": 0.7,
  "description": "무주택자 또는 1주택자를 위한 장기 고정금리 주택담보대출"
}
```
---
## 12. 시스템 구조
### 해커톤 MVP 권장 구조
```plain text
Frontend
- React
- Tailwind
- Chart UI

Backend
- FastAPI 또는 Spring Boot
- Simulation API
- Policy Rule API
- AI Strategy API

Data
- Static JSON
- SQLite 또는 메모리 데이터

AI
- OpenAI API
- Function Calling
- RAG-lite 정책 문서 검색
```
### API 예시
<table header-row="true">
<tr>
<td>API</td>
<td>설명</td>
</tr>
<tr>
<td>POST /api/parse-input</td>
<td>자연어 입력을 구조화 데이터로 변환</td>
</tr>
<tr>
<td>POST /api/simulation/golden-cross</td>
<td>매수 D-Day 계산</td>
</tr>
<tr>
<td>POST /api/simulation/stress-test</td>
<td>리스크 시나리오 계산</td>
</tr>
<tr>
<td>POST /api/loans/eligibility</td>
<td>정책대출 적격성 판정</td>
</tr>
<tr>
<td>POST /api/ai/strategy-card</td>
<td>AI 전략 카드 생성</td>
</tr>
</table>
---
## 13. 화면 구성
### 1. 랜딩 화면
```plain text
전세에서 내 집까지,
내 조건으로 계산하는 매수 전환 D-Day
```
CTA: `내 상황 입력하고 D-Day 확인하기`
### 2. 조건 입력 화면
- 자연어 입력창
- 수동 입력 폼
- 전세 보증금
- 현금 자산
- 월 저축액
- 연 소득
- 목표 지역
- 목표 가격
### 3. 결과 대시보드
<table header-row="true">
<tr>
<td>영역</td>
<td>내용</td>
</tr>
<tr>
<td>D-Day 카드</td>
<td>“36개월 뒤 매수 가능”</td>
</tr>
<tr>
<td>자산 성장 그래프</td>
<td>자산 성장선과 필요 자기자본선</td>
</tr>
<tr>
<td>정책대출 카드</td>
<td>가능/불가능/추가 확인</td>
</tr>
<tr>
<td>스트레스 테스트</td>
<td>시나리오별 D-Day 변화</td>
</tr>
<tr>
<td>AI 전략 카드</td>
<td>지금 해야 할 일 3가지</td>
</tr>
</table>
### 4. 전략 선택 화면
- 빠른 매수 전략
- 안정 준비 전략
- 정책대출 우선 전략
- 목표 지역 조정 전략
선택 시 D-Day 재계산
---
## 14. 차별화 포인트
<table header-row="true">
<tr>
<td>기존 서비스</td>
<td>InSeoul</td>
</tr>
<tr>
<td>단순 대출 계산기</td>
<td>매수 가능 시점까지 계산</td>
</tr>
<tr>
<td>부동산 정보 나열</td>
<td>사용자 조건 기반 전략 제안</td>
</tr>
<tr>
<td>일반 챗봇 상담</td>
<td>계산 결과 기반 AI 전략 카드</td>
</tr>
<tr>
<td>집값 중심</td>
<td>사용자가 통제 가능한 변수 중심</td>
</tr>
<tr>
<td>단일 결과</td>
<td>전략별 시나리오 비교</td>
</tr>
</table>
---
## 15. 핵심 메시지
> InSeoul은 집값을 예측하는 서비스가 아닙니다.
> 사용자가 통제할 수 있는 자산, 저축, 대출 조건을 바탕으로 **내 집 마련 가능 시점을 앞당기는 전략을 설계하는 서비스**입니다.
---
## 16. 경험 기반 기획 근거
<table header-row="true">
<tr>
<td>InSeoul 기능</td>
<td>연결 경험</td>
<td>근거</td>
</tr>
<tr>
<td>AI 전략 카드</td>
<td>AlgoSu AI 리뷰 흐름</td>
<td>AI 기능을 서비스 흐름 안에 통합</td>
</tr>
<tr>
<td>자연어 조건 입력</td>
<td>Chat To Do Function Calling</td>
<td>자연어를 구조화 파라미터로 추출</td>
</tr>
<tr>
<td>정책 RAG 설명</td>
<td>Chat To Do RAG / Graph RAG Second Brain</td>
<td>맥락 기반 검색·근거 추적</td>
</tr>
<tr>
<td>리스크 해석</td>
<td>AlgoSu 운영 안정성</td>
<td>외부 AI 장애·비용·품질 관리</td>
</tr>
<tr>
<td>전략 선택 구조</td>
<td>Human-in-the-Loop</td>
<td>사람이 결정, AI가 실행</td>
</tr>
</table>
---
## 17. 기대 효과
### 사용자 관점
- 내 집 마련 가능 시점을 숫자로 확인
- 정책대출 가능성을 쉽게 이해
- 금리/집값 변화에 따른 리스크 파악
- 지금 해야 할 행동을 구체적으로 확인
### 서비스 관점
- 부동산 계산기보다 높은 개인화
- AI 챗봇보다 명확한 문제 해결
- 해커톤 데모에 적합한 시각화 가능
- 기존 InSeoul 아키텍처를 축소 재사용 가능
### 포트폴리오 관점
- AI를 단순 부가 기능이 아니라 핵심 의사결정 흐름에 통합
- 자연어 입력, RAG, 시뮬레이션, 전략 추천을 하나의 제품 경험으로 연결
- AI 제품화 경험과 직접 연결 가능
---
## 18. 해커톤 발표용 요약
```plain text
서울에서 내 집 마련을 고민하는 사람들은
집값보다 먼저 “내가 언제 살 수 있는지”를 모릅니다.

InSeoul은 전세 보증금, 현금 자산, 월 저축액, 목표 지역을 입력하면
매수 가능 시점과 정책대출 가능성을 계산하고,
금리·집값 변화에 따른 리스크를 보여줍니다.

AI는 부동산 구매를 단정하지 않습니다.
대신 계산 결과를 해석해 사용자가 선택할 수 있는 전략 카드를 제공합니다.

즉, InSeoul은 집값 예측 서비스가 아니라
내가 통제 가능한 변수로 매수 가능 시점을 설계하는
AI 부동산 전략 시뮬레이터입니다.
```
---
## 19. 최종 한 줄
> **InSeoul은 서울 전세 거주자의 현재 자산과 목표 지역을 바탕으로 매수 가능 시점, 정책대출 가능성, 리스크 변화, 실행 전략을 계산해주는 AI 부동산 전략 시뮬레이터입니다.**
<empty-block/>
<page url="https://app.notion.com/p/3870b4608674810d84dec0b9745422db">01. 요구사항 정의서</page>
<page url="https://app.notion.com/p/3870b4608674811bab9ed5496d5af9eb">02. UseCase Diagram</page>
<page url="https://app.notion.com/p/3870b46086748165b33cf8999d4916ac">03. WBS</page>
<page url="https://app.notion.com/p/3870b460867481da8c0fd083b1942bc8">04. ERD</page>
<page url="https://app.notion.com/p/3870b460867481cabd6df0484c260a4b">05. API 설계서</page>
<page url="https://app.notion.com/p/3870b460867481e0879bdde68cce9f64">06. Class Diagram</page>
<page url="https://app.notion.com/p/3870b460867481d4ad47d3bb40cbf71a">07. 화면정의서</page>
<page url="https://app.notion.com/p/3870b46086748106b0fae3d9ab3c87b3">08. 모노레포 API 분리 변경 계획</page>
