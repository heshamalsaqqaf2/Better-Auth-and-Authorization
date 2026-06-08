export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface LayerValidator<T> {
  validate(value: unknown): ValidationResult;
  belongsToLayer(value: unknown): boolean;
}
