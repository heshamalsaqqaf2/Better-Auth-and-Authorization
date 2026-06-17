import { createOperationId } from "@/Core/Kernel/Primitives/Types/operation-id.type";
import type { ApplicationResult } from "../../Application/Results/application-result";
import { createSystemError } from "../Errors/presentation-error";
import type { PresentationResult } from "../Results/presentation-result";
import { failureResult, successResult } from "../Results/presentation-result";
import { mapApplicationToPresentationError } from "./application-to-presentation-error.mapper";

export function mapApplicationToPresentationResult<T>(
  appResult: ApplicationResult<T>,
  params: { operationName: string },
  options?: { userMessageOverrides?: Record<string, string> },
): PresentationResult<T> {
  try {
    const operationId = createOperationId(params.operationName);

    if (appResult.isSuccess) {
      return successResult(appResult.data as T, operationId);
    }

    const mappedError = mapApplicationToPresentationError(
      appResult.error as Parameters<typeof mapApplicationToPresentationError>[0],
      options,
    );
    return failureResult(mappedError, operationId);
  } catch {
    const operationId = createOperationId(params.operationName);
    return failureResult(createSystemError("An unexpected error occurred", "MAPPER_ERROR", "critical"), operationId);
  }
}
