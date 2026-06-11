import type { ApplicationError } from "./application-error";

export function isApplicationError(value: unknown): value is ApplicationError {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.operationName !== "string") {
    return false;
  }

  if (typeof obj.correlationId !== "string" || (obj.correlationId as string).length === 0) {
    return false;
  }

  if (obj.layer !== "application") {
    return false;
  }

  return true;
}
