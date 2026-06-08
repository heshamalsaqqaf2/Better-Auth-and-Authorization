import type { DomainError } from "./domain-error";

export function isDomainError(value: unknown): value is DomainError {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.businessRule !== "string") {
    return false;
  }

  if (typeof obj.aggregateId !== "string") {
    return false;
  }

  return true;
}
