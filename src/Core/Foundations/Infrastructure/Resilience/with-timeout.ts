import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { InfrastructureComponent } from "../Contracts/infrastructure-component.type";
import { InfrastructureError } from "../Errors/infrastructure-error";
import type { InfrastructureResult } from "../Results/infrastructure-result";

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  options?: { systemComponent?: InfrastructureComponent; errorCode?: string },
): Promise<InfrastructureResult<T>> {
  const timeoutPromise: Promise<never> = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return ok(result);
  } catch {
    return err(
      new InfrastructureError({
        code: options?.errorCode ?? "TIMEOUT",
        message: "Operation timed out",
        systemComponent: options?.systemComponent ?? "Network",
        retryStrategy: "exponential",
      }),
    );
  }
}
