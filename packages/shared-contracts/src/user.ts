/** 사용자 — 가이드 8-1: /api/users/me, /api/users/me/profile */
import type { UserId, Won } from "./common.js";

export interface User {
  id: UserId;
  email: string;
  nickname: string;
}

/** 사용자 재무 프로필. 사용자별 DB에 user_id 기준으로 저장. */
export interface UserProfile {
  /** 월 소득(원). */
  monthlyIncome: Won;
  /** 월 저축 가능액(원). */
  monthlySavings: Won;
  /** 현재 보유 자산(원). */
  currentAssets: Won;
  /** 목표 지역 코드 (districts.code 참조). */
  targetDistrictCode?: string;
}

/** GET /api/users/me */
export interface MeResponse {
  user: User;
  profile: UserProfile | null;
}

/** PUT /api/users/me/profile */
export type UpdateProfileRequest = UserProfile;
export type UpdateProfileResponse = UserProfile;
