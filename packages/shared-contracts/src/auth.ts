/** 인증 — 가이드 8-1: /api/auth/* */
import type { UserId, IsoDateTime } from "./common.js";

export interface SignupRequest {
  email: string;
  /** 평문 — 서버에서 반드시 해시 저장. 응답에 절대 포함 금지. */
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** access 토큰 만료 시각. */
  expiresAt: IsoDateTime;
}

export interface AuthUser {
  id: UserId;
  email: string;
  nickname: string;
}

/** POST /api/auth/signup, POST /api/auth/login 응답. */
export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/** POST /api/auth/logout — 본문 없음, 204. */
export type LogoutResponse = void;
