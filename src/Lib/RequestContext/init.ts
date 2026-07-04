import type { CorrelationId } from "@/Core/Foundations/Types";
import { runWithStore } from "./store";

export function withRequestContext<T>(correlationId: CorrelationId, fn: () => Promise<T>): Promise<T> {
  return runWithStore({ correlationId }, fn);
}
