export type ValidationErrorShape = {
  readonly _tag: "ValidationError";
  readonly errorCode: string;
  readonly fieldErrors: Record<string, string[]>;
};

export type NotFoundErrorShape = {
  readonly _tag: "NotFoundError";
  readonly errorCode: string;
  readonly userMessage: string;
  readonly suggestedAction?: string;
};

export type AuthorizationErrorShape = {
  readonly _tag: "AuthorizationError";
  readonly errorCode: string;
  readonly userMessage: string;
};

export type SystemErrorShape = {
  readonly _tag: "SystemError";
  readonly errorCode: string;
  readonly userMessage: string;
  readonly severity: "warning" | "error" | "critical";
};

export type NetworkErrorShape = {
  readonly _tag: "NetworkError";
  readonly errorCode: string;
  readonly userMessage: string;
  readonly retryable: boolean;
};

export type PresentationError =
  | ValidationErrorShape
  | NotFoundErrorShape
  | AuthorizationErrorShape
  | SystemErrorShape
  | NetworkErrorShape;

export function createValidationError(
  errorCode: string,
  fieldErrors: Record<string, string[]>
): ValidationErrorShape {
  return { _tag: "ValidationError", errorCode, fieldErrors };
}

export function createNotFoundError(
  errorCode: string,
  userMessage: string,
  suggestedAction?: string
): NotFoundErrorShape {
  return {
    _tag: "NotFoundError",
    errorCode,
    userMessage,
    ...(suggestedAction !== undefined ? { suggestedAction } : {}),
  };
}

export function createAuthorizationError(
  errorCode: string,
  userMessage: string
): AuthorizationErrorShape {
  return { _tag: "AuthorizationError", errorCode, userMessage };
}

export function createSystemError(
  errorCode: string,
  userMessage: string,
  severity: "warning" | "error" | "critical"
): SystemErrorShape {
  return { _tag: "SystemError", errorCode, userMessage, severity };
}

export function createNetworkError(
  errorCode: string,
  userMessage: string,
  retryable: boolean
): NetworkErrorShape {
  return { _tag: "NetworkError", errorCode, userMessage, retryable };
}
