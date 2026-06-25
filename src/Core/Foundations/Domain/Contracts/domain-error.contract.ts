import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export interface DomainErrorContract extends ErrorBase {
  readonly code: ErrorCode;
  readonly businessRule: string;
  readonly aggregateId: string;
}
