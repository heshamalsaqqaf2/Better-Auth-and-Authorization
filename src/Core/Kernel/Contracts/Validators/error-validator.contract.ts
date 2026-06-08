import type { ValidationResult } from "./layer-validator.contract";

export interface ErrorValidator<T> {
  validate(error: T): ValidationResult;
  satisfiesContract(error: T): boolean;
}
