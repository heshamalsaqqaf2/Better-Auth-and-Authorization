import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { InfrastructureRetryStrategy } from "../../Contracts/infrastructure-retry-strategy.type";
import { InfrastructureError } from "../infrastructure-error";

export class ApiTimeoutError extends InfrastructureError {
  constructor(params: {
    message?: string;
    retryCount?: number;
    retryStrategy?: InfrastructureRetryStrategy;
    safeDetails?: Record<string, unknown>;
    cause?: ErrorBaseContract;
  }) {
    const infraParams: ConstructorParameters<typeof InfrastructureError>[0] = {
      code: "API_TIMEOUT_ERROR",
      message: params.message ?? "External API request timed out",
      systemComponent: "Network",
    };
    if (params.retryCount !== undefined) {
      (infraParams as { retryCount: number }).retryCount = params.retryCount;
    }
    if (params.retryStrategy !== undefined) {
      (infraParams as { retryStrategy: InfrastructureRetryStrategy }).retryStrategy = params.retryStrategy;
    }
    if (params.safeDetails !== undefined) {
      (infraParams as { safeDetails: Record<string, unknown> }).safeDetails = params.safeDetails;
    }
    if (params.cause !== undefined) {
      (infraParams as { cause: ErrorBaseContract }).cause = params.cause;
    }
    super(infraParams);
  }
}
