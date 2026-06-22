import type { ApiResponse, MeData } from "@inseoul/shared-contracts";

/** 모든 호출은 Back-end API(/api/*)로만. AI(/internal/ai/*) 직접 호출 금지(NFR-12). */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) throw new Error(body.error.message);
  return body.data;
}

export async function getMe(accessToken: string): Promise<MeData> {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`GET /api/users/me failed: ${res.status}`);
  return unwrap<MeData>(res);
}
