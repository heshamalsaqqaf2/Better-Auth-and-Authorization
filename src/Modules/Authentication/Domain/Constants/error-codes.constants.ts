import type { ErrorCode } from "@/Core/Foundations/Domain";

export const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: "AUTH_USER_NOT_FOUND" as ErrorCode,
  INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS" as ErrorCode,
  EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS" as ErrorCode,
  AUTH_FAILED: "AUTH_FAILED" as ErrorCode,
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
