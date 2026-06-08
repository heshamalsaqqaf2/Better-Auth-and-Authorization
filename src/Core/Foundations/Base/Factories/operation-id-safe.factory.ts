import {
  createOperationId,
  type OperationId,
} from "@/Core/Kernel/Primitives/Types/operation-id.type";
import { err, ok, type ResultBase } from "../Abstracts/result-base";
import type { ValidationError } from "./validation-error";
import { createValidationError } from "./validation-error";

export function createOperationIdSafe(
  value: string,
): ResultBase<OperationId, ValidationError> {
  try {
    return ok(createOperationId(value));
  } catch (e) {
    return err(createValidationError((e as Error).message));
  }
}
