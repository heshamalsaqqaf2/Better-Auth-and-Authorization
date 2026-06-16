import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import { ApplicationError } from "../../Application/Errors/application-error";
import type { InfrastructureError } from "../Errors/infrastructure-error";
import { sanitizeInfraError } from "./sanitize-infra-error";

/**
 * Maps an InfrastructureError to an ApplicationError for upward propagation.
 *
 * Per D-21 (Infrastructure→Application direction) and D-22 (generic single mapper):
 * - Calls sanitizeInfraError() defensively before creating the ApplicationError (D-11)
 * - Passes infraError.code and infraError.message as-is
 * - Wraps the full InfrastructureError as the ApplicationError's cause (preserves cause chain for logging)
 */
export function mapInfrastructureToAppError(
  infraError: InfrastructureError,
  params: {
    operationName: string;
    correlationId: CorrelationId;
  },
): ApplicationError {
  // Defensively sanitize — strips hostnames, IPs, and stack traces before
  // the error propagates upward (D-11, D-12, T-05-04)
  sanitizeInfraError(infraError);

  const appErrorParams: ConstructorParameters<typeof ApplicationError>[0] = {
    code: infraError.code,
    message: infraError.message,
    operationName: params.operationName,
    correlationId: params.correlationId,
    cause: infraError,
  };
  return new ApplicationError(appErrorParams);
}
