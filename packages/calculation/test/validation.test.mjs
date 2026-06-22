// 입력 검증 케이스 — NSLPRJCT-30.
import assert from "node:assert/strict";
import { test } from "node:test";

import { goldenCross, validateGoldenCrossParams } from "../dist/index.js";

const ok = {
  cashAsset: 30_000_000,
  jeonseDeposit: 200_000_000,
  monthlySaving: 1_500_000,
  targetPrice: 900_000_000,
  ltv: 0.7,
  expectedGrowthRate: 0.03,
  acquisitionTaxRate: 0.011,
};

test("정상 입력은 통과", () => {
  assert.doesNotThrow(() => validateGoldenCrossParams(ok));
});

const badCases = [
  ["targetPrice 0 이하", { targetPrice: 0 }],
  ["음수 현금", { cashAsset: -1 }],
  ["음수 월저축", { monthlySaving: -100 }],
  ["ltv > 1", { ltv: 1.5 }],
  ["ltv < 0", { ltv: -0.1 }],
  ["NaN 성장률", { expectedGrowthRate: NaN }],
  ["성장률 -1 이하", { expectedGrowthRate: -1 }],
  ["음수 취득세율", { acquisitionTaxRate: -0.01 }],
  ["maxMonths 비정수", { maxMonths: 12.5 }],
];

for (const [name, patch] of badCases) {
  test(`비정상 입력 RangeError: ${name}`, () => {
    assert.throws(() => goldenCross({ ...ok, ...patch }), RangeError);
  });
}
