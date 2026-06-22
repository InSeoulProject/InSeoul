// 스트레스 테스트 검증 — NSLPRJCT-30.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_STRESS_DELTAS,
  applyScenario,
  stressTest,
} from "../dist/index.js";

const base = {
  cashAsset: 30_000_000,
  jeonseDeposit: 200_000_000,
  monthlySaving: 1_500_000,
  targetPrice: 900_000_000,
  ltv: 0.7,
  expectedGrowthRate: 0.03,
  acquisitionTaxRate: 0.011,
};

test("리스크 시나리오는 D-Day를 지연시킨다(delayed >= 0)", () => {
  const byType = Object.fromEntries(stressTest(base).map((r) => [r.scenarioType, r]));
  assert.ok(byType.INTEREST_RATE_UP.delayedMonths >= 0);
  assert.ok(byType.PRICE_UP.delayedMonths >= 0);
  assert.ok(byType.SAVING_DOWN.delayedMonths >= 0);
});

test("저축 증가 시나리오는 D-Day를 단축시킨다(delayed <= 0)", () => {
  const byType = Object.fromEntries(stressTest(base).map((r) => [r.scenarioType, r]));
  assert.ok(byType.SAVING_UP.delayedMonths <= 0);
});

test("changedValue 는 적용된 델타와 일치", () => {
  for (const r of stressTest(base)) {
    assert.equal(r.changedValue, DEFAULT_STRESS_DELTAS[r.scenarioType]);
  }
});

test("커스텀 델타를 지정할 수 있다", () => {
  const [r] = stressTest(base, [{ scenarioType: "SAVING_DOWN", delta: -0.5 }]);
  assert.equal(r.changedValue, -0.5);
  assert.ok(r.delayedMonths >= 0);
});

test("applyScenario 는 원본 파라미터를 변형하지 않는다(불변)", () => {
  const before = { ...base };
  const next = applyScenario(base, { scenarioType: "INTEREST_RATE_UP" });
  assert.deepEqual(base, before); // 원본 불변
  assert.ok(next.ltv < base.ltv); // 금리 상승 → 유효 LTV 하락
});

test("stressTest 결과는 결정론적", () => {
  assert.deepEqual(stressTest(base), stressTest(base));
});
