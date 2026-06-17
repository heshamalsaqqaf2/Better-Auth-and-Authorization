import type { PresentationError } from "../Errors/presentation-error.types";

export type PresentationSuccess<T> = {
  readonly _tag: "Success";
  readonly data: T;
  readonly operationId: string;
};

export type PresentationFailure = {
  readonly _tag: "Failure";
  readonly error: PresentationError;
  readonly operationId: string;
};

export type PresentationResult<T> = PresentationSuccess<T> | PresentationFailure;

export function successResult<T>(data: T, operationId: string): PresentationSuccess<T> {
  return { _tag: "Success", data, operationId };
}

export function failureResult(error: PresentationError, operationId: string): PresentationFailure {
  return { _tag: "Failure", error, operationId };
}
