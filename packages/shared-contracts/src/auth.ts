/** 인증 — API 설계서 3장: /api/auth/* */
import type { Id } from "./common.js";

export interface SignupRequest {
  email: string;
  /** 평문 — 서버에서 반드시 해시 저장(NFR-01). 응답에 포함 금지. */
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: Id;
  email: string;
  nickname: string;
}

/** POST /api/auth/signup, /api/auth/login 의 data. (토큰은 flat) */
export interface AuthData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** POST /api/auth/refresh */
export interface RefreshRequest {
  refreshToken: string;
}
export interface RefreshData {
  accessToken: string;
  refreshToken: string;
}

/** POST /api/auth/logout — 본문 없음. */
export type LogoutData = Record<string, never>;
