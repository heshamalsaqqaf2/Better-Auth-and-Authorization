import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";

export interface DomainErrorContract extends ErrorBase {
  readonly businessRule: string;
  readonly aggregateId: string;
}
