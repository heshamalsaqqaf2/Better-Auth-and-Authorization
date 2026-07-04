import { ErrorBase } from "@/Core/Foundations/Base/Abstracts/error-base";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
import type { InfrastructureErrorContract } from "../Contracts/infrastructure-error.contract";
import type { InfrastructureComponent } from "../Types/infrastructure-component.type";
import type { InfrastructureRetryStrategy } from "../Types/infrastructure-retry-strategy.type";

export class InfrastructureError extends ErrorBase implements InfrastructureErrorContract {
  readonly systemComponent: InfrastructureComponent;
  readonly retryCount?: number;
  readonly retryStrategy?: InfrastructureRetryStrategy;
  readonly safeDetails?: Record<string, unknown>;

  constructor(params: {
    code: ErrorCode;
    message: string;
    systemComponent: InfrastructureComponent;
    retryCount?: number;
    retryStrategy?: InfrastructureRetryStrategy;
    safeDetails?: Record<string, unknown>;
    cause?: ErrorBaseContract;
  }) {
    super(LayerType.INFRASTRUCTURE, params.code, params.message, params.cause);
    this.systemComponent = params.systemComponent;
    if (params.retryCount !== undefined) {
      (this as { retryCount: number }).retryCount = params.retryCount;
    }
    if (params.retryStrategy !== undefined) {
      (this as { retryStrategy: InfrastructureRetryStrategy }).retryStrategy = params.retryStrategy;
    }
    if (params.safeDetails !== undefined) {
      (this as { safeDetails: Record<string, unknown> }).safeDetails = params.safeDetails;
    }
  }

  override isRecoverable(): boolean {
    return true;
  }
}
