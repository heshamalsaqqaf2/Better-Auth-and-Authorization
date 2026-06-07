import type { ValidationResult } from "./layer-validator.contract";

export interface ResultValidator<T> {
  validate(result: unknown): ValidationResult;
  satisfiesContract(result: unknown): boolean;
}
