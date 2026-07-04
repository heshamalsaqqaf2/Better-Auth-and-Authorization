import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import { ApplicationError } from "../application-error";
import { APPLICATION_ERROR_CODES } from "../application-error-codes";

export class UseCaseExecutionError extends ApplicationError {
  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    cause: ErrorBaseContract;
  }) {
    const appErrorParams: ConstructorParameters<typeof ApplicationError>[0] = {
      code: APPLICATION_ERROR_CODES.USE_CASE_EXECUTION_ERROR,
      message: `Use case '${params.operationName}' execution failed`,
      operationName: params.operationName,
      correlationId: params.correlationId,
      cause: params.cause,
    };
    if (params.userId !== undefined) {
      (appErrorParams as { userId: string }).userId = params.userId;
    }
    super(appErrorParams);
  }
}
