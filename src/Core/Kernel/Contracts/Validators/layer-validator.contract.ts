export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface LayerValidator {
  validate(value: unknown): ValidationResult;
  belongsToLayer(value: unknown): boolean;
}
