// golden-cross 검증 케이스 — NSLPRJCT-30. 빌드된 dist 를 대상으로 검증.
import assert from "node:assert/strict";
import { test } from "node:test";

import { assetAt, goldenCross, requiredCapitalAt, targetPriceAt } from "../dist/index.js";

const baseParams = {
  cashAsset: 0,
  jeonseDeposit: 0,
  monthlySaving: 1_000_000,
  targetPrice: 100_000_000,
  ltv: 0.5,
  expectedGrowthRate: 0,
  acquisitionTaxRate: 0,
};

test("성장률 0·수익률 0이면 선형 적립으로 정확한 D-Day", () => {
  // required = 1억*(1-0.5) = 5천만, asset = 100만*t → t=50 에서 교차.
  const r = goldenCross(baseParams);
  assert.equal(r.dDayMonths, 50);
  assert.equal(r.requiredCapital, 50_000_000);
  assert.equal(r.availableAsset, 50_000_000);
  assert.equal(r.targetPriceAtPurchase, 100_000_000);
});

test("초기 자산이 이미 충분하면 D-Day=0", () => {
  const r = goldenCross({ ...baseParams, cashAsset: 60_000_000, monthlySaving: 0 });
  assert.equal(r.dDayMonths, 0);
});

test("저축 0·수익 0이고 부족하면 도달 불가(null)", () => {
  const r = goldenCross({ ...baseParams, monthlySaving: 0, maxMonths: 120 });
  assert.equal(r.dDayMonths, null);
  // 도달 불가여도 참고 수치는 maxMonths 기준으로 채워진다.
  assert.equal(r.requiredCapital, 50_000_000);
});

test("동일 입력 → 동일 결과(결정론, NFR-03)", () => {
  const a = goldenCross(baseParams);
  const b = goldenCross(baseParams);
  assert.deepEqual(a, b);
});

test("월 저축이 많을수록 D-Day는 같거나 빨라진다(단조성)", () => {
  const slow = goldenCross({ ...baseParams, monthlySaving: 1_000_000 }).dDayMonths;
  const fast = goldenCross({ ...baseParams, monthlySaving: 2_000_000 }).dDayMonths;
  assert.ok(fast <= slow);
});

test("집값 상승률이 높을수록 D-Day는 같거나 늦어진다(단조성)", () => {
  const low = goldenCross({ ...baseParams, monthlySaving: 1_500_000, expectedGrowthRate: 0.02 });
  const high = goldenCross({ ...baseParams, monthlySaving: 1_500_000, expectedGrowthRate: 0.06 });
  const l = low.dDayMonths ?? Infinity;
  const h = high.dDayMonths ?? Infinity;
  assert.ok(h >= l);
});

test("보조 함수: assetAt/targetPriceAt/requiredCapitalAt 정확성", () => {
  assert.equal(assetAt(0, 1_000_000, 10, 0), 10_000_000); // 선형
  assert.equal(targetPriceAt(100_000_000, 0, 24), 100_000_000); // 상승 0
  assert.equal(targetPriceAt(100_000_000, 0.03, 12), 103_000_000); // 1년 +3%
  // 0.3 + 0.011 = 0.311 (부동소수 오차 허용)
  assert.ok(Math.abs(requiredCapitalAt(100_000_000, 0, 0.7, 0.011, 0) - 31_100_000) < 1);
});
