import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
import { InfrastructureError } from "../Errors/infrastructure-error";
import { INFRASTRUCTURE_ERROR_CODES } from "../Errors/infrastructure-error-codes";
import type { InfrastructureResult } from "../Results/infrastructure-result";
import type { InfrastructureComponent } from "../Types/infrastructure-component.type";
import type { InfrastructureRetryStrategy } from "../Types/infrastructure-retry-strategy.type";

const TIMEOUT_MARKER = "__OPERATION_TIMEOUT__";

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  options?: { systemComponent?: InfrastructureComponent; errorCode?: ErrorCode },
): Promise<InfrastructureResult<T>> {
  const timeoutPromise: Promise<never> = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(TIMEOUT_MARKER)), ms),
  );
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return ok(result);
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === TIMEOUT_MARKER;
    if (isTimeout) {
      return err(
        new InfrastructureError({
          code: options?.errorCode ?? INFRASTRUCTURE_ERROR_CODES.OPERATION_TIMEOUT,
          message: "Operation timed out",
          systemComponent: options?.systemComponent ?? "Network",
          retryStrategy: "exponential" as InfrastructureRetryStrategy,
        }),
      );
    }
    return err(
      new InfrastructureError({
        code: INFRASTRUCTURE_ERROR_CODES.SYSTEM_ERROR,
        message: error instanceof Error ? error.message : "Operation failed",
        systemComponent: options?.systemComponent ?? "Network",
      }),
    );
  }
}
