import {
  createErrorCode,
  type ErrorCode,
} from "@/Core/Kernel/Primitives/Types/error-code.type";
import { err, ok, type ResultBase } from "../Abstracts/result-base";
import type { ValidationError } from "./validation-error";
import { createValidationError } from "./validation-error";

export function createErrorCodeSafe(
  value: string,
): ResultBase<ErrorCode, ValidationError> {
  try {
    return ok(createErrorCode(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
