import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { ResultBase as ResultBaseContract } from "@/Core/Kernel/Contracts/Base/result-base.contract";
import type { ErrorBase as ErrorBaseImpl } from "./error-base";

export abstract class ResultBase<T, E extends ErrorBaseImpl>
  implements ResultBaseContract<T, E>
{
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;
  abstract readonly data?: T;
  abstract readonly error?: E;

  abstract map<U>(fn: (data: T) => U): ResultBaseContract<U, E>;
  abstract flatMap<U>(
    fn: (data: T) => ResultBaseContract<U, E>,
  ): ResultBaseContract<U, E>;
  abstract mapError<F extends ErrorBase>(
    fn: (error: E) => F,
  ): ResultBaseContract<T, F>;
  abstract match<R>(handlers: {
    onSuccess: (data: T) => R;
    onFailure: (error: E) => R;
  }): R;
  abstract fold<R>(onSuccess: (data: T) => R, onFailure: (error: E) => R): R;
  abstract tap(fn: (data: T) => void): ResultBaseContract<T, E>;
  abstract tapError(fn: (error: E) => void): ResultBaseContract<T, E>;
}

export class Success<T> extends ResultBase<T, never> {
  readonly isSuccess = true;
  readonly isFailure = false;
  readonly error?: never;

  constructor(readonly data: T) {
    super();
  }

  map<U>(fn: (data: T) => U): Success<U> {
    return new Success(fn(this.data));
  }

  flatMap<U>(
    fn: (data: T) => ResultBaseContract<U, never>,
  ): ResultBaseContract<U, never> {
    return fn(this.data);
  }

  mapError<F extends ErrorBase>(_fn: (error: never) => F): Success<T> {
    return this;
  }

  match<R>(handlers: {
    onSuccess: (data: T) => R;
    onFailure: (error: never) => R;
  }): R {
    return handlers.onSuccess(this.data);
  }

  fold<R>(onSuccess: (data: T) => R, _onFailure: (error: never) => R): R {
    return onSuccess(this.data);
  }

  tap(fn: (data: T) => void): this {
    fn(this.data);
    return this;
  }

  tapError(_fn: (error: never) => void): this {
    return this;
  }
}

export class Failure<T, E extends ErrorBaseImpl> extends ResultBase<T, E> {
  readonly isSuccess = false;
  readonly isFailure = true;
  readonly data?: T;

  constructor(readonly error: E) {
    super();
  }

  map<U>(_fn: (data: T) => U): ResultBaseContract<U, E> {
    return this as unknown as ResultBaseContract<U, E>;
  }

  flatMap<U>(
    _fn: (data: T) => ResultBaseContract<U, E>,
  ): ResultBaseContract<U, E> {
    return this as unknown as ResultBaseContract<U, E>;
  }

  mapError<F extends ErrorBase>(fn: (error: E) => F): Failure<T, F> {
    return new Failure<T, F>(fn(this.error));
  }

  match<R>(handlers: {
    onSuccess: (data: T) => R;
    onFailure: (error: E) => R;
  }): R {
    return handlers.onFailure(this.error);
  }

  fold<R>(_onSuccess: (data: T) => R, onFailure: (error: E) => R): R {
    return onFailure(this.error);
  }

  tap(_fn: (data: T) => void): this {
    return this;
  }

  tapError(fn: (error: E) => void): this {
    fn(this.error);
    return this;
  }
}

export function ok<T>(data: T): Success<T> {
  return new Success(data);
}

export function err<E extends ErrorBaseImpl>(error: E): Failure<never, E> {
  return new Failure<never, E>(error);
}
