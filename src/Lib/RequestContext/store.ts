import { AsyncLocalStorage } from "node:async_hooks";
import type { CorrelationId } from "@/Core/Foundations/Types";

export interface RequestContextStore {
  readonly correlationId: CorrelationId;
}

const als = new AsyncLocalStorage<RequestContextStore>();

export function getCorrelationId(): CorrelationId | undefined {
  return als.getStore()?.correlationId;
}

export function runWithStore<T>(store: RequestContextStore, fn: () => Promise<T>): Promise<T> {
  return als.run(store, fn);
}
