import type { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
import type {
  AuthenticationErrorShape,
  AuthorizationErrorShape,
  NetworkErrorShape,
  NotFoundErrorShape,
  SystemErrorShape,
  ValidationErrorShape,
} from "./presentation-error.types";

export function createValidationError(
  errorCode: ErrorCode,
  fieldErrors: Record<string, string[]>,
): ValidationErrorShape {
  return { _tag: "ValidationError", errorCode, fieldErrors };
}

export function createNotFoundError(
  errorCode: ErrorCode,
  userMessage: string,
  suggestedAction?: string,
): NotFoundErrorShape {
  return {
    _tag: "NotFoundError",
    errorCode,
    userMessage,
    ...(suggestedAction !== undefined ? { suggestedAction } : {}),
  };
}

export function createAuthenticationError(errorCode: ErrorCode, userMessage: string): AuthenticationErrorShape {
  return { _tag: "AuthenticationError", errorCode, userMessage };
}

export function createAuthorizationError(errorCode: ErrorCode, userMessage: string): AuthorizationErrorShape {
  return { _tag: "AuthorizationError", errorCode, userMessage };
}

export function createSystemError(errorCode: ErrorCode, userMessage: string, severity: Severity): SystemErrorShape {
  return { _tag: "SystemError", errorCode, userMessage, severity };
}

export function createNetworkError(errorCode: ErrorCode, userMessage: string, retryable: boolean): NetworkErrorShape {
  return { _tag: "NetworkError", errorCode, userMessage, retryable };
}
