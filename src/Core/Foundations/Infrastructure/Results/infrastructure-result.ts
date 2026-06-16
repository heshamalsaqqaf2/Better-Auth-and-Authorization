import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { InfrastructureError } from "../Errors/infrastructure-error";

export type InfrastructureResult<T> = ResultBase<T, InfrastructureError>;
