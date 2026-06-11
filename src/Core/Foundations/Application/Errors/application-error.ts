import { ErrorBase } from "@/Core/Foundations/Base/Abstracts/error-base";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import type { ApplicationErrorContract } from "../Contracts/application-error.contract";

export class ApplicationError extends ErrorBase implements ApplicationErrorContract {
  readonly operationName: string;
  readonly correlationId: CorrelationId;
  readonly userId?: string;

  constructor(params: {
    code: string;
    message: string;
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    cause?: ErrorBaseContract;
  }) {
    super(LayerType.APPLICATION, params.code, params.message, params.cause);
    this.operationName = params.operationName;
    this.correlationId = params.correlationId;
    if (params.userId !== undefined) {
      (this as { userId: string }).userId = params.userId;
    }
  }
}
