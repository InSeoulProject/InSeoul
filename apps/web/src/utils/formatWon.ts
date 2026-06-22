/** 숫자(원)를 "N억 M,000만원" 형식으로 포맷. */
export function formatWon(won: number): string {
  if (won === 0) return "0원";
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만원`);
  if (parts.length === 0) parts.push(`${won.toLocaleString()}원`);
  return parts.join(" ");
}

/** 만원 단위 → 원 변환 */
export function manToWon(man: number): number {
  return man * 10_000;
}

/** 원 → 만원 단위 변환 */
export function wonToMan(won: number): number {
  return won / 10_000;
}
