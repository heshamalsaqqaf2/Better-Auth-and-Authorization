import type { ValidationResult } from "./layer-validator.contract";

export interface ResultValidator<T> {
  validate(result: T): ValidationResult;
  satisfiesContract(result: T): boolean;
}
