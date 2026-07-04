import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import { ApplicationError } from "../application-error";
import { APPLICATION_ERROR_CODES } from "../application-error-codes";

export class CommandValidationError extends ApplicationError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    fieldErrors: Record<string, string[]>;
    cause?: ApplicationError;
  }) {
    const fieldCount = Object.keys(params.fieldErrors).length;
    const appErrorParams: ConstructorParameters<typeof ApplicationError>[0] = {
      code: APPLICATION_ERROR_CODES.COMMAND_VALIDATION_ERROR,
      message: `Command validation failed with ${fieldCount} field error(s)`,
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
    this.fieldErrors = params.fieldErrors;
  }

  override isRecoverable(): boolean {
    return false;
  }
}
