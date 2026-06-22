import type { ErrorBase } from "./error-base.contract";

export interface ResultBase<T, E extends ErrorBase> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly data?: T;
  readonly error?: E;

  map<U>(fn: (data: T) => U): ResultBase<U, E>;
  flatMap<U>(fn: (data: T) => ResultBase<U, E>): ResultBase<U, E>;
  mapError<F extends ErrorBase>(fn: (error: E) => F): ResultBase<T, F>;
  match<R>(handlers: { onSuccess: (data: T) => R; onFailure: (error: E) => R }): R;
  tap(fn: (data: T) => void): ResultBase<T, E>;
  tapError(fn: (error: E) => void): ResultBase<T, E>;
}
