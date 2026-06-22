/** 사용자 — API 설계서 4장: /api/users/me, /api/users/me/profile */
import type { Id, Won } from "./common.js";

export interface User {
  id: Id;
  email: string;
  nickname: string;
}

export type MaritalStatus = "single" | "married";

/** 사용자 재무/주거 프로필 (ERD USER_PROFILES). user_id 기준 저장. */
export interface UserProfile {
  cashAsset: Won;
  jeonseDeposit: Won;
  monthlySaving: Won;
  annualIncome: Won;
  firstHomeBuyer: boolean;
  maritalStatus: MaritalStatus;
}

/** GET /api/users/me */
export interface MeData {
  user: User;
}

/** PUT/GET /api/users/me/profile */
export type UpdateProfileRequest = UserProfile;
export type ProfileData = UserProfile;
