import type { OperationId } from "@/Core/Kernel/Primitives/Types/operation-id.type";
import type { PresentationError } from "../Errors/presentation-error.types";

export type PresentationSuccess<T> = {
  readonly _tag: "Success";
  readonly data: T;
  readonly operationId: OperationId;
};

export type PresentationFailure = {
  readonly _tag: "Failure";
  readonly error: PresentationError;
  readonly operationId: OperationId;
};

export type PresentationResult<T> = PresentationSuccess<T> | PresentationFailure;

export function successResult<T>(data: T, operationId: OperationId): PresentationSuccess<T> {
  return { _tag: "Success", data, operationId };
}

export function failureResult(error: PresentationError, operationId: OperationId): PresentationFailure {
  return { _tag: "Failure", error, operationId };
}
