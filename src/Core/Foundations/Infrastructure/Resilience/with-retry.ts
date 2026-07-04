import { err } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
import { InfrastructureError } from "../Errors/infrastructure-error";
import { INFRASTRUCTURE_ERROR_CODES } from "../Errors/infrastructure-error-codes";
import type { InfrastructureResult } from "../Results/infrastructure-result";
import type { InfrastructureComponent } from "../Types/infrastructure-component.type";
import type { InfrastructureRetryStrategy } from "../Types/infrastructure-retry-strategy.type";

export interface RetryOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  systemComponent?: InfrastructureComponent;
  errorCode?: ErrorCode;
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
  const errorCode = options?.errorCode ?? INFRASTRUCTURE_ERROR_CODES.RETRY_EXHAUSTED;

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
          retryStrategy: "exponential" as InfrastructureRetryStrategy,
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
