declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };
export type ErrorCode = Brand<string, "ErrorCode">;

export function createErrorCode(value: string): ErrorCode {
  if (value.length === 0) throw new TypeError("ErrorCode must be non-empty");
  return value as ErrorCode;
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && value.length > 0;
}

export function defineErrorCode<T extends string>(value: T): ErrorCode {
  return createErrorCode(value);
}
