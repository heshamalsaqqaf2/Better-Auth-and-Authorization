import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export const DOMAIN_ERROR_CODES = {
  INVALID_INPUT: defineErrorCode("INVALID_INPUT"),
  VALIDATION_ERROR: defineErrorCode("VALIDATION_ERROR"),
} as const satisfies Record<string, ErrorCode>;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];
