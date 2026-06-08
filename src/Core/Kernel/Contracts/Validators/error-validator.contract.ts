import type { ValidationResult } from "./layer-validator.contract";

export interface ErrorValidator<T> {
  validate(error: unknown): ValidationResult;
  satisfiesContract(error: unknown): boolean;
}
