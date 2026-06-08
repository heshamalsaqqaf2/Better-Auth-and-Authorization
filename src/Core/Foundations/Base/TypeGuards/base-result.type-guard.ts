import type { ErrorBase } from "../Abstracts/error-base";
import type { ResultBase } from "../Abstracts/result-base";

export function isBaseResult(value: unknown): value is ResultBase<unknown, ErrorBase> {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.isSuccess !== "boolean") {
    return false;
  }

  if (typeof obj.isFailure !== "boolean") {
    return false;
  }

  if (typeof obj.map !== "function") {
    return false;
  }

  if (typeof obj.match !== "function") {
    return false;
  }

  return true;
}
