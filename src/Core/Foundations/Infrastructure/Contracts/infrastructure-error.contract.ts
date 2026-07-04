import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { InfrastructureComponent, InfrastructureRetryStrategy } from "../Types";

export interface InfrastructureErrorContract extends ErrorBase {
  readonly systemComponent: InfrastructureComponent;
  readonly retryCount?: number;
  readonly retryStrategy?: InfrastructureRetryStrategy;
  readonly safeDetails?: Record<string, unknown>;
}
