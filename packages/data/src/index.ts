/**
 * 지역 가격 / 정책대출 seed 데이터 — NSLPRJCT-28.
 *
 * 데모/시드용 값이며 실제 시세·정책 고시가가 아니다(MVP). 형태는
 * packages/shared-contracts 의 DistrictPrice / LoanProduct 계약과 일치한다.
 * 빌드 순서 결합을 피하려 타입은 로컬로 재선언한다(계산 패키지와 동일 패턴).
 */

/** shared-contracts DistrictPrice 와 동일 형태(매매/전세 평균, 기준일). */
export interface DistrictPrice {
  district: string;
  /** 평균 아파트 매매가(원) */
  averagePrice: number;
  /** 평균 전세가(원) */
  jeonsePrice: number;
  /** 기준일 YYYY-MM-DD */
  baseDate: string;
}

/** shared-contracts LoanProduct 와 동일 형태. */
export interface LoanProduct {
  name: string;
  /** 대상 주택 가격 상한(원) */
  maxHousePrice: number;
  /** 소득 상한(원, 연소득 기준) */
  maxIncome: number;
  /** 최대 LTV(0~1) */
  ltv: number;
  description: string;
}

const BASE_DATE = "2026-06-01";

/** 서울 25개 자치구 평균 시세(데모 seed). 매매/전세 단위: 원. */
export const DISTRICT_PRICES: readonly DistrictPrice[] = [
  { district: "종로구", averagePrice: 1_180_000_000, jeonsePrice: 640_000_000, baseDate: BASE_DATE },
  { district: "중구", averagePrice: 1_120_000_000, jeonsePrice: 620_000_000, baseDate: BASE_DATE },
  { district: "용산구", averagePrice: 1_950_000_000, jeonsePrice: 880_000_000, baseDate: BASE_DATE },
  { district: "성동구", averagePrice: 1_420_000_000, jeonsePrice: 760_000_000, baseDate: BASE_DATE },
  { district: "광진구", averagePrice: 1_280_000_000, jeonsePrice: 700_000_000, baseDate: BASE_DATE },
  { district: "동대문구", averagePrice: 980_000_000, jeonsePrice: 580_000_000, baseDate: BASE_DATE },
  { district: "중랑구", averagePrice: 780_000_000, jeonsePrice: 470_000_000, baseDate: BASE_DATE },
  { district: "성북구", averagePrice: 950_000_000, jeonsePrice: 560_000_000, baseDate: BASE_DATE },
  { district: "강북구", averagePrice: 720_000_000, jeonsePrice: 440_000_000, baseDate: BASE_DATE },
  { district: "도봉구", averagePrice: 690_000_000, jeonsePrice: 420_000_000, baseDate: BASE_DATE },
  { district: "노원구", averagePrice: 780_000_000, jeonsePrice: 460_000_000, baseDate: BASE_DATE },
  { district: "은평구", averagePrice: 880_000_000, jeonsePrice: 520_000_000, baseDate: BASE_DATE },
  { district: "서대문구", averagePrice: 1_010_000_000, jeonsePrice: 590_000_000, baseDate: BASE_DATE },
  { district: "마포구", averagePrice: 1_380_000_000, jeonsePrice: 740_000_000, baseDate: BASE_DATE },
  { district: "양천구", averagePrice: 1_150_000_000, jeonsePrice: 620_000_000, baseDate: BASE_DATE },
  { district: "강서구", averagePrice: 980_000_000, jeonsePrice: 560_000_000, baseDate: BASE_DATE },
  { district: "구로구", averagePrice: 850_000_000, jeonsePrice: 510_000_000, baseDate: BASE_DATE },
  { district: "금천구", averagePrice: 800_000_000, jeonsePrice: 490_000_000, baseDate: BASE_DATE },
  { district: "영등포구", averagePrice: 1_220_000_000, jeonsePrice: 660_000_000, baseDate: BASE_DATE },
  { district: "동작구", averagePrice: 1_280_000_000, jeonsePrice: 690_000_000, baseDate: BASE_DATE },
  { district: "관악구", averagePrice: 920_000_000, jeonsePrice: 540_000_000, baseDate: BASE_DATE },
  { district: "서초구", averagePrice: 2_450_000_000, jeonsePrice: 1_080_000_000, baseDate: BASE_DATE },
  { district: "강남구", averagePrice: 2_680_000_000, jeonsePrice: 1_150_000_000, baseDate: BASE_DATE },
  { district: "송파구", averagePrice: 1_780_000_000, jeonsePrice: 860_000_000, baseDate: BASE_DATE },
  { district: "강동구", averagePrice: 1_240_000_000, jeonsePrice: 680_000_000, baseDate: BASE_DATE },
];

/** 정책대출 상품(데모 seed). 한도 단위: 원, ltv: 0~1. */
export const LOAN_PRODUCTS: readonly LoanProduct[] = [
  {
    name: "보금자리론",
    maxHousePrice: 600_000_000,
    maxIncome: 70_000_000,
    ltv: 0.7,
    description: "무주택 또는 1주택 처분 조건, 주택 6억 이하·소득 7천만원 이하 대상.",
  },
  {
    name: "디딤돌대출",
    maxHousePrice: 500_000_000,
    maxIncome: 60_000_000,
    ltv: 0.7,
    description: "생애최초·무주택 세대주 대상, 주택 5억 이하·부부합산 소득 6천만원 이하.",
  },
  {
    name: "신생아 특례 디딤돌",
    maxHousePrice: 900_000_000,
    maxIncome: 130_000_000,
    ltv: 0.8,
    description: "2년 내 출산 가구 대상, 주택 9억 이하·소득 1.3억원 이하, 우대 금리.",
  },
  {
    name: "신혼부부 전용 디딤돌",
    maxHousePrice: 600_000_000,
    maxIncome: 85_000_000,
    ltv: 0.8,
    description: "혼인 7년 이내 신혼부부 대상, 주택 6억 이하·부부합산 소득 8.5천만원 이하.",
  },
];

const DISTRICT_INDEX: ReadonlyMap<string, DistrictPrice> = new Map(
  DISTRICT_PRICES.map((d) => [d.district, d]),
);
const LOAN_INDEX: ReadonlyMap<string, LoanProduct> = new Map(
  LOAN_PRODUCTS.map((p) => [p.name, p]),
);

/** 자치구명으로 평균 시세 조회(없으면 undefined). */
export function getDistrictPrice(district: string): DistrictPrice | undefined {
  return DISTRICT_INDEX.get(district);
}

/** 등록된 자치구명 목록. */
export function listDistricts(): string[] {
  return DISTRICT_PRICES.map((d) => d.district);
}

/** 정책대출명으로 상품 조회(없으면 undefined). */
export function getLoanProduct(name: string): LoanProduct | undefined {
  return LOAN_INDEX.get(name);
}
