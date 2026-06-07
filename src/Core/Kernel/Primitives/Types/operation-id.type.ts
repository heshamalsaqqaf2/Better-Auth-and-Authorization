declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type OperationId = Brand<string, 'OperationId'>;

export function createOperationId(value: string): OperationId {
  if (value.length === 0) {
    throw new TypeError('OperationId must be a non-empty string');
  }
  return value as OperationId;
}

export function isOperationId(value: unknown): value is OperationId {
  return typeof value === 'string' && value.length > 0;
}
