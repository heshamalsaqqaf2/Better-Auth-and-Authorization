import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export interface ApplicationErrorContract extends ErrorBase {
  readonly operationName: string;
  readonly correlationId: CorrelationId;
  readonly userId?: string;
}
