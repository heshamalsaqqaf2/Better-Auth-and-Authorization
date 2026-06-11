import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { ApplicationError } from "../Errors/application-error";

export type ApplicationResult<T> = ResultBase<T, ApplicationError>;
