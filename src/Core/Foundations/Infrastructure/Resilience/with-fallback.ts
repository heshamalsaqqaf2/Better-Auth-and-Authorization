import { ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { InfrastructureResult } from "../Results/infrastructure-result";

export function withFallback<T>(result: InfrastructureResult<T>, fallback: T): InfrastructureResult<T> {
  if (result.isSuccess) {
    return result;
  }
  return ok(fallback);
}
