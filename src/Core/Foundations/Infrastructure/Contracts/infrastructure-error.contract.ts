import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { InfrastructureComponent } from "./infrastructure-component.type";
import type { InfrastructureRetryStrategy } from "./infrastructure-retry-strategy.type";

export interface InfrastructureErrorContract extends ErrorBase {
  readonly systemComponent: InfrastructureComponent;
  readonly retryCount?: number;
  readonly retryStrategy?: InfrastructureRetryStrategy;
  readonly safeDetails?: Record<string, unknown>;
}
