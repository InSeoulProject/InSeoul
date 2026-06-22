/** 공통 타입 — API 설계서(05)의 응답 래퍼/공용 타입. */

/** 표준 API 응답: 성공은 { success:true, data }, 실패는 { success:false, error }. */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  /** 필드 단위 검증 오류 (선택). */
  details?: Record<string, string>;
}

/** DB id (ERD: bigint). */
export type Id = number;

/** 인증 사용자 식별자. 모든 사용자 데이터는 이 값 기준으로 격리(NFR-02). */
export type UserId = Id;

export type Won = number;

/** ISO-8601 (예: 2026-06-22T10:00:00). */
export type IsoDateTime = string;
/** YYYY-MM-DD. */
export type IsoDate = string;
