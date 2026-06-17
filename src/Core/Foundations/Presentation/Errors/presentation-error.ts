import type {
  AuthorizationErrorShape,
  NetworkErrorShape,
  NotFoundErrorShape,
  SystemErrorShape,
  ValidationErrorShape,
} from "./presentation-error.types";

export function createValidationError(errorCode: string, fieldErrors: Record<string, string[]>): ValidationErrorShape {
  return { _tag: "ValidationError", errorCode, fieldErrors };
}

export function createNotFoundError(
  errorCode: string,
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

export function createAuthorizationError(errorCode: string, userMessage: string): AuthorizationErrorShape {
  return { _tag: "AuthorizationError", errorCode, userMessage };
}

export function createSystemError(
  errorCode: string,
  userMessage: string,
  severity: "warning" | "error" | "critical",
): SystemErrorShape {
  return { _tag: "SystemError", errorCode, userMessage, severity };
}

export function createNetworkError(errorCode: string, userMessage: string, retryable: boolean): NetworkErrorShape {
  return { _tag: "NetworkError", errorCode, userMessage, retryable };
}
