import type { MeResponse } from "@inseoul/shared-contracts";

/** 모든 호출은 Back-end API(/api/*)로만. AI(/internal/ai/*) 직접 호출 금지. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function getMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`GET /api/users/me failed: ${res.status}`);
  return (await res.json()) as MeResponse;
}
