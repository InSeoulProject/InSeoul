/** D-Day 계산 공식 및 검증 케이스. */

/** 목표 금액까지 월 저축으로 도달하는 데 필요한 개월 수. */
export function monthsToTarget(
  currentAssets: number,
  targetAmount: number,
  monthlySavings: number,
): number {
  if (monthlySavings <= 0) return Infinity;
  const remaining = targetAmount - currentAssets;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthlySavings);
}

/** 개월 수를 대략적인 D-Day(일)로 변환 (30일 기준). */
export function monthsToDDay(months: number): number {
  return Number.isFinite(months) ? months * 30 : Infinity;
}
