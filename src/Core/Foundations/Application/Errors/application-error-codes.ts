import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export const APPLICATION_ERROR_CODES = {
  MAPPER_ERROR: defineErrorCode("MAPPER_ERROR"),
  AUTHORIZATION_ERROR: defineErrorCode("AUTHORIZATION_ERROR"),
  COMMAND_VALIDATION_ERROR: defineErrorCode("COMMAND_VALIDATION_ERROR"),
  QUERY_VALIDATION_ERROR: defineErrorCode("QUERY_VALIDATION_ERROR"),
  USE_CASE_EXECUTION_ERROR: defineErrorCode("USE_CASE_EXECUTION_ERROR"),
  NOT_FOUND: defineErrorCode("NOT_FOUND"),
} as const satisfies Record<string, ErrorCode>;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[keyof typeof APPLICATION_ERROR_CODES];
