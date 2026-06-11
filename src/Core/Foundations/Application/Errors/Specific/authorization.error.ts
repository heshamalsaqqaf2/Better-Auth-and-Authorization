import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import { ApplicationError } from "../application-error";

export class AuthorizationFailedError extends ApplicationError {
  readonly reason: string;

  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    reason: string;
    cause?: ApplicationError;
  }) {
    const appErrorParams: ConstructorParameters<typeof ApplicationError>[0] = {
      code: "AUTHORIZATION_FAILED",
      message: `Authorization failed: ${params.reason}`,
      operationName: params.operationName,
      correlationId: params.correlationId,
    };
    if (params.userId !== undefined) {
      (appErrorParams as { userId: string }).userId = params.userId;
    }
    if (params.cause !== undefined) {
      (appErrorParams as { cause: ErrorBaseContract }).cause = params.cause;
    }
    super(appErrorParams);
    this.reason = params.reason;
  }

  override isRecoverable(): boolean {
    return false;
  }
}
