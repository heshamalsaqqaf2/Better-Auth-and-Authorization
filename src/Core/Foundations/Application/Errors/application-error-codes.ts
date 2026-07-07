import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export const APPLICATION_ERROR_CODES = {
  COMMAND_VALIDATION_ERROR: defineErrorCode("COMMAND_VALIDATION_ERROR"),
  QUERY_VALIDATION_ERROR: defineErrorCode("QUERY_VALIDATION_ERROR"),
  USE_CASE_EXECUTION_ERROR: defineErrorCode("USE_CASE_EXECUTION_ERROR"),
  MAPPER_ERROR: defineErrorCode("MAPPER_ERROR"),
} as const satisfies Record<string, ErrorCode>;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[keyof typeof APPLICATION_ERROR_CODES];
