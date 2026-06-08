import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { DomainError } from "../Errors/domain-error";

export type DomainResult<T> = ResultBase<T, DomainError>;
