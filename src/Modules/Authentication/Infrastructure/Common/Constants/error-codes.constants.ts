import { defineErrorCode, type ErrorCode } from "@/Core/Foundations/Types";

export const AUTH_INFRA_ERROR_CODES = {
  AUTH_API_TIMEOUT: defineErrorCode("AUTH_API_TIMEOUT"),
  AUTH_RETRY_EXHAUSTED: defineErrorCode("AUTH_RETRY_EXHAUSTED"),
  AUTH_SESSION_FAILED: defineErrorCode("AUTH_SESSION_FAILED"),
  AUTH_UNKNOWN_ERROR: defineErrorCode("AUTH_UNKNOWN_ERROR"),
} as const satisfies Record<string, ErrorCode>;

export type AuthInfraErrorCode = (typeof AUTH_INFRA_ERROR_CODES)[keyof typeof AUTH_INFRA_ERROR_CODES];
