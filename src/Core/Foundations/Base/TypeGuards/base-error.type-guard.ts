import type { ErrorBase } from "../Abstracts/error-base";

export function isBaseError(value: unknown): value is ErrorBase {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.code !== "string") {
    return false;
  }

  if (typeof obj.message !== "string") {
    return false;
  }

  if (!(obj.timestamp instanceof Date)) {
    return false;
  }

  if (typeof obj.layer !== "string") {
    return false;
  }

  return true;
}
