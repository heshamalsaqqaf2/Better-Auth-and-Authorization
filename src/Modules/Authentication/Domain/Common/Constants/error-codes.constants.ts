import { defineErrorCode, type ErrorCode } from "@/Core/Foundations/Types";

export const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: defineErrorCode("AUTH_USER_NOT_FOUND"),
  INVALID_CREDENTIALS: defineErrorCode("AUTH_INVALID_CREDENTIALS"),
  EMAIL_ALREADY_EXISTS: defineErrorCode("AUTH_EMAIL_ALREADY_EXISTS"),
  AUTH_FAILED: defineErrorCode("AUTH_FAILED"),
} as const satisfies Record<string, ErrorCode>;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
