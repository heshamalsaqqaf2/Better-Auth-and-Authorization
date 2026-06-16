import { err } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { InfrastructureComponent } from "../Contracts/infrastructure-component.type";
import { InfrastructureError } from "../Errors/infrastructure-error";
import type { InfrastructureResult } from "../Results/infrastructure-result";

export interface RetryOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  systemComponent?: InfrastructureComponent;
  errorCode?: string;
}

export function withRetry<T>(
  fn: () => Promise<InfrastructureResult<T>>,
  maxRetries: number,
  options?: RetryOptions,
): Promise<InfrastructureResult<T>> {
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const maxDelayMs = options?.maxDelayMs ?? 30000;
  const jitterMax = options?.jitterFactor ?? 100;
  const systemComponent = options?.systemComponent ?? "Network";
  const errorCode = options?.errorCode ?? "RETRY_EXHAUSTED";

  async function attempt(attemptCount: number): Promise<InfrastructureResult<T>> {
    const result = await fn();
    if (result.isSuccess) {
      return result;
    }
    if (attemptCount >= maxRetries) {
      return err(
        new InfrastructureError({
          code: errorCode,
          message: "All retry attempts exhausted",
          systemComponent,
          retryCount: attemptCount,
          retryStrategy: "exponential",
          ...(result.error ? { cause: result.error } : {}),
        }),
      );
    }
    const delay = Math.min(baseDelayMs * 2 ** attemptCount + Math.random() * jitterMax, maxDelayMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return attempt(attemptCount + 1);
  }

  return attempt(0);
}
