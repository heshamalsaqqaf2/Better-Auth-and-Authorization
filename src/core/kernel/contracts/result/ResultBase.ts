import type { ITraceableError } from "@/core/kernel/contracts/error/ITraceableError";
import type { IResult, ResultType } from "./IResult";

export class ResultBase<T, E extends ITraceableError> {
  // implements IResult<T, E>
  protected readonly _result: ResultType<T, E>;

  protected constructor(result: ResultType<T, E>) {
    this._result = Object.freeze(result) as ResultType<T, E>;
  }

  public get isSuccess(): boolean {
    return this._result.isSuccess;
  }
  public get isFailure(): boolean {
    return this._result.isFailure;
  }

  public ok<T, E extends ITraceableError = ITraceableError>(
    value: T,
  ): ResultBase<T, E> {
    return new ResultBase<T, E>({
      isSuccess: true,
      isFailure: false,
      value,
      error: null,
    });
  }
  public fail<T = never, E extends ITraceableError = ITraceableError>(
    error: E,
  ): ResultBase<T, E> {
    return new ResultBase<T, E>({
      isSuccess: false,
      isFailure: true,
      value: null,
      error,
    });
  }
  public getValue(): T | null {
    return this._result.isSuccess ? this._result.value : null;
  }
  public getError(): E | null {
    return this._result.isFailure ? this._result.error : null;
  }
}
