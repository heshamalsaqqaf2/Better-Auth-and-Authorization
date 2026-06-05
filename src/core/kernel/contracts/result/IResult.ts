/**
 * @file IResult.ts
 * @description واجهة النتيجة الموحدة - الأساس لجميع النتائج في النظام
 * @remarks
 * - تستخدم نمط Result Pattern للتعامل مع الأخطاء بدون throw
 * - جميع النتائج في النظام يجب أن تنفذ هذه الواجهة
 * - تدعم Functional Chaining عبر map/flatMap/tap
 */

import type { ITraceableError } from "@/core/kernel/contracts/error/ITraceableError";

export interface IResult<T, E extends ITraceableError = ITraceableError> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;

  getValue(): T | null;
  getError(): E | null;
}

export type SuccessResult<T> = {
  readonly isSuccess: true;
  readonly isFailure: false;
  readonly value: T;
  readonly error: null;
};
export type FailureResult<E extends ITraceableError> = {
  readonly isSuccess: false;
  readonly isFailure: true;
  readonly value: null;
  readonly error: E;
};

// Type Guards
export type ResultType<T, E extends ITraceableError = ITraceableError> =
  | SuccessResult<T>
  | FailureResult<E>;
export const isSuccessResult = <T, E extends ITraceableError>(
  result: IResult<T, E> | ResultType<T, E>,
): result is SuccessResult<T> => {
  return result.isSuccess === true;
};
export const isFailureResult = <T, E extends ITraceableError>(
  result: IResult<T, E> | ResultType<T, E>,
): result is FailureResult<E> => {
  return result.isFailure === true;
};

export type AsyncResult<
  T,
  E extends ITraceableError = ITraceableError,
> = Promise<IResult<T, E>>;
export type ResultHandlerFn<T, E extends ITraceableError, R = void> = (
  result: IResult<T, E>,
) => R;
