import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export const PRESENTATION_ERROR_CODES = {
  NOT_FOUND: defineErrorCode("NOT_FOUND"),
  FORBIDDEN: defineErrorCode("FORBIDDEN"),
  CONFLICT: defineErrorCode("CONFLICT"),
  UNAUTHORIZED: defineErrorCode("UNAUTHORIZED"),
  BAD_REQUEST: defineErrorCode("BAD_REQUEST"),
  TIMEOUT: defineErrorCode("TIMEOUT"),
  INTERNAL_ERROR: defineErrorCode("INTERNAL_ERROR"),
  SERVICE_UNAVAILABLE: defineErrorCode("SERVICE_UNAVAILABLE"),
  TOO_MANY_REQUESTS: defineErrorCode("TOO_MANY_REQUESTS"),
  UNSUPPORTED_MEDIA_TYPE: defineErrorCode("UNSUPPORTED_MEDIA_TYPE"),
} as const satisfies Record<string, ErrorCode>;

export type PresentationErrorCode = (typeof PRESENTATION_ERROR_CODES)[keyof typeof PRESENTATION_ERROR_CODES];
