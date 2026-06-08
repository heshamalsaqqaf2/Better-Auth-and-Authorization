import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import { DomainError } from "../Errors/domain-error";

export type DomainResult<T> = ResultBase<T, DomainError>;
