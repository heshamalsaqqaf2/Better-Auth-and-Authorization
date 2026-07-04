import { AsyncLocalStorage } from "node:async_hooks";
import type { CorrelationId } from "@/Core/Foundations/Types";

export interface RequestContextStore {
  readonly correlationId: CorrelationId;
}

export const requestContextStore = new AsyncLocalStorage<RequestContextStore>();

export function setCorrelationId(id: CorrelationId): void {
  const store = requestContextStore.getStore();
  if (store) {
    requestContextStore.enterWith({ ...store, correlationId: id });
  }
}

export function getCorrelationId(): CorrelationId | undefined {
  return requestContextStore.getStore()?.correlationId;
}

export function runWithStore<T>(store: RequestContextStore, fn: () => Promise<T>): Promise<T> {
  return requestContextStore.run(store, fn);
}
