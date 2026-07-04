import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { InfrastructureRetryStrategy } from "../../Types/infrastructure-retry-strategy.type";
import { InfrastructureError } from "../infrastructure-error";
import { INFRASTRUCTURE_ERROR_CODES } from "../infrastructure-error-codes";

export class DatabaseQueryError extends InfrastructureError {
  constructor(params: {
    message?: string;
    retryCount?: number;
    retryStrategy?: InfrastructureRetryStrategy;
    safeDetails?: Record<string, unknown>;
    cause?: ErrorBaseContract;
  }) {
    const infraParams: ConstructorParameters<typeof InfrastructureError>[0] = {
      code: INFRASTRUCTURE_ERROR_CODES.DATABASE_QUERY_ERROR,
      message: params.message ?? "Database query execution failed",
      systemComponent: "Database",
    };
    if (params.retryCount !== undefined) infraParams.retryCount = params.retryCount;
    if (params.retryStrategy !== undefined) infraParams.retryStrategy = params.retryStrategy;
    if (params.safeDetails !== undefined) infraParams.safeDetails = params.safeDetails;
    if (params.cause !== undefined) infraParams.cause = params.cause;
    super(infraParams);
  }
}
