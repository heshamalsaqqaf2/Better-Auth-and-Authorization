import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export interface RequestContext {
  readonly correlationId: CorrelationId;
  readonly userId?: string;
}
