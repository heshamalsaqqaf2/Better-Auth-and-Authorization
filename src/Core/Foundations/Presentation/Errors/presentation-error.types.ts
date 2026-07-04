import type { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export type ValidationErrorShape = {
  readonly _tag: "ValidationError";
  readonly errorCode: ErrorCode;
  readonly fieldErrors: Record<string, string[]>;
};

export type NotFoundErrorShape = {
  readonly _tag: "NotFoundError";
  readonly errorCode: ErrorCode;
  readonly userMessage: string;
  readonly suggestedAction?: string;
};

export type AuthorizationErrorShape = {
  readonly _tag: "AuthorizationError";
  readonly errorCode: ErrorCode;
  readonly userMessage: string;
};

export type AuthenticationErrorShape = {
  readonly _tag: "AuthenticationError";
  readonly errorCode: ErrorCode;
  readonly userMessage: string;
};

export type SystemErrorShape = {
  readonly _tag: "SystemError";
  readonly errorCode: ErrorCode;
  readonly userMessage: string;
  readonly severity: Severity;
};

export type NetworkErrorShape = {
  readonly _tag: "NetworkError";
  readonly errorCode: ErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
};

export type PresentationError =
  | ValidationErrorShape
  | NotFoundErrorShape
  | AuthenticationErrorShape
  | AuthorizationErrorShape
  | SystemErrorShape
  | NetworkErrorShape;
