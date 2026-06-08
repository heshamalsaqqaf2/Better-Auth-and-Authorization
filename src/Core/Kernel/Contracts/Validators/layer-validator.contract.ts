export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface LayerValidator<T> {
  validate(value: T): ValidationResult;
  belongsToLayer(value: T): boolean;
}
