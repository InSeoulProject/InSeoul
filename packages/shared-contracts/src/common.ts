/** 공통 타입 — 모든 API 응답/에러/페이지네이션의 기반. */

/** 성공/실패를 감싸는 표준 API 응답 래퍼. */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface ApiError {
  /** 머신 판독용 코드 (예: AUTH_INVALID_CREDENTIALS). */
  code: string;
  /** 사람이 읽는 메시지. */
  message: string;
  /** 필드 단위 검증 오류 (선택). */
  details?: Record<string, string>;
}

export interface Pagination {
  page: number;
  size: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/** ISO-8601 문자열 (예: 2026-06-22T10:00:00Z). */
export type IsoDateTime = string;

/** YYYY-MM-DD. */
export type IsoDate = string;

/** 인증 사용자 식별자. 모든 사용자 생성 데이터는 이 값 기준으로 분리된다. */
export type UserId = string;

export type Won = number;
