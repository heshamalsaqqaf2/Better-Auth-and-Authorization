import { createCorrelationId, type CorrelationId } from "../../../Kernel/Primitives/Types/correlation-id.type";
import { ok, err, type ResultBase } from "../Abstracts/result-base";
import { createValidationError } from "./validation-error";
import type { ValidationError } from "./validation-error";

export function createCorrelationIdSafe(value: string): ResultBase<CorrelationId, ValidationError> {
  try {
    return ok(createCorrelationId(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
