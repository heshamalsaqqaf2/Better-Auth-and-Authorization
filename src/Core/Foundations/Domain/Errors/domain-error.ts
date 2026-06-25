import { ErrorBase } from "@/Core/Foundations/Base/Abstracts/error-base";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
import type { DomainErrorContract } from "../Contracts/domain-error.contract";

export class DomainError extends ErrorBase implements DomainErrorContract {
  constructor(
    override readonly code: ErrorCode,
    override readonly message: string,
    readonly businessRule: string,
    readonly aggregateId: string,
    cause?: DomainErrorContract,
  ) {
    super(LayerType.DOMAIN, code, message, cause);
  }
}
