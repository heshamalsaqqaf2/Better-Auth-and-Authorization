import { createErrorCode, type ErrorCode } from "../../../Kernel/Primitives/Types/error-code.type";
import { ok, err, type ResultBase } from "../Abstracts/result-base";
import { createValidationError } from "./validation-error";
import type { ValidationError } from "./validation-error";

export function createErrorCodeSafe(value: string): ResultBase<ErrorCode, ValidationError> {
  try {
    return ok(createErrorCode(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
