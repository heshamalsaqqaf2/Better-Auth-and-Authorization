import { ApplicationError } from "../../Application/Errors/application-error";
import { AuthorizationFailedError } from "../../Application/Errors/Specific/authorization.error";
import { CommandValidationError } from "../../Application/Errors/Specific/command-validation.error";
import {
  createAuthorizationError,
  createNotFoundError,
  createSystemError,
  createValidationError,
} from "../Errors/presentation-error";
import type { PresentationError } from "../Errors/presentation-error.types";

function autoUserMessage(message: string): string {
  const colonIdx = message.indexOf(":");
  const parenIdx = message.indexOf("(");
  if (colonIdx !== -1 && (parenIdx === -1 || colonIdx < parenIdx)) {
    return message.slice(0, colonIdx).trim();
  }
  if (parenIdx !== -1) {
    return message.slice(0, parenIdx).trim();
  }
  return message;
}

function getUserMessage(
  appError: ApplicationError,
  options?: { userMessageOverrides?: Record<string, string> },
): string {
  const overrides = options?.userMessageOverrides;
  if (overrides) {
    const override = overrides[appError.code];
    if (override !== undefined) {
      return override;
    }
  }
  return autoUserMessage(appError.message);
}

export function mapApplicationToPresentationError(
  appError: ApplicationError,
  options?: { userMessageOverrides?: Record<string, string> },
): PresentationError {
  if (appError instanceof CommandValidationError) {
    return createValidationError(appError.code, appError.fieldErrors);
  }

  if (appError instanceof AuthorizationFailedError) {
    return createAuthorizationError(appError.code, getUserMessage(appError, options));
  }

  if (appError.code.startsWith("NOT_FOUND_")) {
    return createNotFoundError(appError.code, getUserMessage(appError, options));
  }

  const hasFieldErrors = "fieldErrors" in appError;
  if (hasFieldErrors) {
    const fieldErrors = (appError as Record<string, unknown>).fieldErrors;
    return createValidationError(
      appError.code,
      fieldErrors as Record<string, string[]>,
    );
  }

  const hasReason = "reason" in appError;
  if (hasReason) {
    return createAuthorizationError(appError.code, getUserMessage(appError, options));
  }

  return createSystemError(appError.code, getUserMessage(appError, options), "error");
}
