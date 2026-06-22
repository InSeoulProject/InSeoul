import type {
  ApiResponse,
  AuthData,
  DistrictPrice,
  GoldenCrossData,
  GoldenCrossRequest,
  LoanEligibilityData,
  LoanEligibilityRequest,
  LoginRequest,
  MeData,
  ParseInputData,
  ProfileData,
  RefreshData,
  SimulationHistoryData,
  SignupRequest,
  StrategyCardData,
  StressTestData,
  UpdateProfileRequest,
} from "@inseoul/shared-contracts";
import { PARSE_INPUT_MOCK } from "./mocks/parseInputMock";
import { useAuthStore } from "./store/authStore";

/** 모든 호출은 Back-end API(/api/*)로만. AI(/internal/ai/*) 직접 호출 금지(NFR-12). */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) throw new Error(body.error.message);
  return body.data;
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE_URL}${url}`, { ...init, headers });

  if (res.status === 401) {
    const storedRefresh = useAuthStore.getState().refreshToken;
    if (storedRefresh) {
      try {
        const refreshed = await refreshTokens(storedRefresh);
        useAuthStore.getState().setAuth({
          user: useAuthStore.getState().user!,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        return fetch(`${BASE_URL}${url}`, {
          ...init,
          headers: { ...headers, Authorization: `Bearer ${refreshed.accessToken}` },
        });
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
  }
  return res;
}

// ── 공개 엔드포인트 ──────────────────────────────────────────

export async function signup(req: SignupRequest): Promise<AuthData> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return unwrap<AuthData>(res);
}

export async function login(req: LoginRequest): Promise<AuthData> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return unwrap<AuthData>(res);
}

export async function logout(accessToken: string): Promise<void> {
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function refreshTokens(refreshToken: string): Promise<RefreshData> {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return unwrap<RefreshData>(res);
}

export async function getDistrictPrices(): Promise<DistrictPrice[]> {
  const res = await fetch(`${BASE_URL}/api/districts/prices`);
  return unwrap<DistrictPrice[]>(res);
}

// ── 인증 필요 엔드포인트 ────────────────────────────────────

export async function getMe(accessToken: string): Promise<MeData> {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return unwrap<MeData>(res);
}

export async function getProfile(_accessToken: string): Promise<ProfileData> {
  const res = await authFetch("/api/users/me/profile");
  return unwrap<ProfileData>(res);
}

export async function updateProfile(_accessToken: string, req: UpdateProfileRequest): Promise<ProfileData> {
  const res = await authFetch("/api/users/me/profile", {
    method: "PUT",
    body: JSON.stringify(req),
  });
  return unwrap<ProfileData>(res);
}

export async function parseInput(_accessToken: string, text: string): Promise<ParseInputData> {
  if (import.meta.env.VITE_ENABLE_PARSE_INPUT_MOCK !== "false") {
    // BE 미구현 — 목업 반환 (VITE_ENABLE_PARSE_INPUT_MOCK=false 로 해제 가능)
    await new Promise((r) => setTimeout(r, 600));
    return PARSE_INPUT_MOCK;
  }
  const res = await authFetch("/api/ai/parse-input", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return unwrap<ParseInputData>(res);
}

export async function runGoldenCross(_accessToken: string, req: GoldenCrossRequest): Promise<GoldenCrossData> {
  const res = await authFetch("/api/simulation/golden-cross", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return unwrap<GoldenCrossData>(res);
}

export async function runStressTest(_accessToken: string, simulationId: number): Promise<StressTestData> {
  const res = await authFetch("/api/simulation/stress-test", {
    method: "POST",
    body: JSON.stringify({ simulationId }),
  });
  return unwrap<StressTestData>(res);
}

export async function getSimulationHistory(_accessToken: string): Promise<SimulationHistoryData> {
  const res = await authFetch("/api/simulation/history");
  return unwrap<SimulationHistoryData>(res);
}

export async function checkLoanEligibility(_accessToken: string, req: LoanEligibilityRequest): Promise<LoanEligibilityData> {
  const res = await authFetch("/api/loans/eligibility", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return unwrap<LoanEligibilityData>(res);
}

export async function createStrategyCard(_accessToken: string, simulationId: number): Promise<StrategyCardData> {
  const res = await authFetch("/api/ai/strategy-card", {
    method: "POST",
    body: JSON.stringify({ simulationId }),
  });
  return unwrap<StrategyCardData>(res);
}
