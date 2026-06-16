import type { InfrastructureError } from "./infrastructure-error";

export function isInfrastructureError(value: unknown): value is InfrastructureError {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.systemComponent !== "string") {
    return false;
  }

  return true;
}
