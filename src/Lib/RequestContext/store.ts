import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
  correlationId: string;
  startTime: number;
}

export const requestContextStore = new AsyncLocalStorage<RequestContextStore>();

export function setCorrelationId(id: string): void {
  const store = requestContextStore.getStore();
  if (store) {
    store.correlationId = id;
  }
}

export function getCorrelationId(): string | undefined {
  return requestContextStore.getStore()?.correlationId;
}

export function getStore(): RequestContextStore | undefined {
  return requestContextStore.getStore();
}

export function runWithStore<T>(store: RequestContextStore, fn: () => Promise<T>): Promise<T> {
  return requestContextStore.run(store, fn);
}
