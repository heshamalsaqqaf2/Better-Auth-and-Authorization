import { createOperationId, type OperationId } from "../../../Kernel/Primitives/Types/operation-id.type";
import { ok, err, type ResultBase } from "../Abstracts/result-base";
import { createValidationError } from "./validation-error";
import type { ValidationError } from "./validation-error";

export function createOperationIdSafe(value: string): ResultBase<OperationId, ValidationError> {
  try {
    return ok(createOperationId(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
