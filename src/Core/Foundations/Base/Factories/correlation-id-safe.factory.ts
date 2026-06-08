import {
  type CorrelationId,
  createCorrelationId,
} from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import { err, ok, type ResultBase } from "../Abstracts/result-base";
import type { ValidationError } from "./validation-error";
import { createValidationError } from "./validation-error";

export function createCorrelationIdSafe(
  value: string,
): ResultBase<CorrelationId, ValidationError> {
  try {
    return ok(createCorrelationId(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
