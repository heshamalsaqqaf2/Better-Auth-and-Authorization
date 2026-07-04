import { runWithStore } from "./store";

export function withRequestContext<T>(correlationId: string, fn: () => Promise<T>): Promise<T> {
  return runWithStore({ correlationId, startTime: Date.now() }, fn);
}
