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
