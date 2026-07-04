import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export const INFRASTRUCTURE_ERROR_CODES = {
  SYSTEM_ERROR: defineErrorCode("SYSTEM_ERROR"),
  CACHE_SERVICE_ERROR: defineErrorCode("CACHE_SERVICE_ERROR"),
  DATABASE_CONNECTION_ERROR: defineErrorCode("DATABASE_CONNECTION_ERROR"),
  DATABASE_QUERY_ERROR: defineErrorCode("DATABASE_QUERY_ERROR"),
  API_TIMEOUT_ERROR: defineErrorCode("API_TIMEOUT_ERROR"),
  API_UNAVAILABLE_ERROR: defineErrorCode("API_UNAVAILABLE_ERROR"),
  RETRY_EXHAUSTED: defineErrorCode("RETRY_EXHAUSTED"),
  OPERATION_TIMEOUT: defineErrorCode("OPERATION_TIMEOUT"),
} as const satisfies Record<string, ErrorCode>;

export type InfrastructureErrorCode = (typeof INFRASTRUCTURE_ERROR_CODES)[keyof typeof INFRASTRUCTURE_ERROR_CODES];
