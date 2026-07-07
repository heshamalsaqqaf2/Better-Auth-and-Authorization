import type { ApplicationError } from "@/Core/Foundations/Application/Errors/application-error";
import { CommandValidationError } from "@/Core/Foundations/Application/Errors/Specific/command-validation.error";
import { QueryValidationError } from "@/Core/Foundations/Application/Errors/Specific/query-validation.error";
import { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import { createAuthorizationError, createSystemError, createValidationError } from "../Errors/presentation-error";
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

function hasFieldErrors(
  error: ApplicationError,
): error is ApplicationError & { fieldErrors: Record<string, string[]> } {
  return "fieldErrors" in error;
}

function hasReason(error: ApplicationError): error is ApplicationError & { reason: string } {
  return "reason" in error;
}

export function mapApplicationToPresentationError(
  appError: ApplicationError,
  options?: { userMessageOverrides?: Record<string, string> },
): PresentationError {
  if (appError instanceof CommandValidationError || appError instanceof QueryValidationError) {
    return createValidationError(appError.code, appError.fieldErrors);
  }

  if (hasFieldErrors(appError)) {
    return createValidationError(appError.code, appError.fieldErrors);
  }

  if (hasReason(appError)) {
    return createAuthorizationError(appError.code, getUserMessage(appError, options));
  }

  return createSystemError(appError.code, getUserMessage(appError, options), Severity.ERROR);
}
