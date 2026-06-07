declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CorrelationId = Brand<string, 'CorrelationId'>;

export function createCorrelationId(value: string): CorrelationId {
  if (value.length === 0) {
    throw new TypeError('CorrelationId must be a non-empty string');
  }
  return value as CorrelationId;
}

export function isCorrelationId(value: unknown): value is CorrelationId {
  return typeof value === 'string' && value.length > 0;
}
