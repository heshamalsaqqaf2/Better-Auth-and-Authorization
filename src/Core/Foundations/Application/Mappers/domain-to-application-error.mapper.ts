import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import type { DomainError } from "../../Domain/Errors/domain-error";
import { ApplicationError } from "../Errors/application-error";

export function mapDomainToAppError(
  domainError: DomainError,
  params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
  },
): ApplicationError {
  const appErrorParams: ConstructorParameters<typeof ApplicationError>[0] = {
    code: domainError.code,
    message: domainError.message,
    operationName: params.operationName,
    correlationId: params.correlationId,
    cause: domainError,
  };
  if (params.userId !== undefined) {
    (appErrorParams as { userId: string }).userId = params.userId;
  }
  return new ApplicationError(appErrorParams);
}
