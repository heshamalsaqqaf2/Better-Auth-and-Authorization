import type { ErrorBase } from "../../../Kernel/Contracts/Base/error-base.contract";
import type { ResultBase as ResultBaseContract } from "../../../Kernel/Contracts/Base/result-base.contract";
import { ErrorBase as ErrorBaseImpl } from "./error-base";

export abstract class ResultBase<T, E extends ErrorBase> {
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;
  abstract readonly data: T | undefined;
  abstract readonly error: E | undefined;
}

export class Success<T> extends ResultBase<T, never> {
  readonly isSuccess = true;
  readonly isFailure = false;
  readonly error: undefined = undefined;

  constructor(readonly data: T) {
    super();
  }

  map<U>(fn: (data: T) => U): Success<U> {
    return new Success(fn(this.data));
  }

  flatMap<U>(fn: (data: T) => ResultBase<U, never>): ResultBase<U, never> {
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

export class Failure<T, E extends ErrorBase> extends ResultBase<T, E> {
  readonly isSuccess = false;
  readonly isFailure = true;
  readonly data: undefined = undefined;

  constructor(readonly error: E) {
    super();
  }

  map<U>(_fn: (data: T) => U): ResultBase<U, E> {
    return this as unknown as ResultBase<U, E>;
  }

  flatMap<U>(_fn: (data: T) => ResultBase<U, E>): ResultBase<U, E> {
    return this as unknown as ResultBase<U, E>;
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

export function err<E extends ErrorBase>(error: E): Failure<never, E> {
  return new Failure<never, E>(error);
}
