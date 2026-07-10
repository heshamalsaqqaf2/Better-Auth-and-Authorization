import { AsyncLocalStorage } from "node:async_hooks";
import type { CorrelationId } from "@/Core/Foundations/Types";

export interface RequestContextStore {
  readonly correlationId: CorrelationId;
}

const als = new AsyncLocalStorage<RequestContextStore>();

// Provides a reading mechanism — returns undefined if called outside ALS scope
export function getCorrelationId(): CorrelationId | undefined {
  return als.getStore()?.correlationId;
}

// Throws if called outside ALS scope — use inside withRequestContextFromHeaders callback
export function requireCorrelationId(): CorrelationId {
  const id = als.getStore()?.correlationId;
  if (!id) {
    throw new Error("CorrelationId unavailable — called outside withRequestContext scope");
  }
  return id;
}

// Provides a writing mechanism
export function runWithStore<T>(store: RequestContextStore, fn: () => Promise<T>): Promise<T> {
  return als.run(store, fn);
}
