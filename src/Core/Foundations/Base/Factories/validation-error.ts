import { LayerType } from "../../../Kernel/Primitives/Enums/layer-type.enum";
import { Severity } from "../../../Kernel/Primitives/Enums/severity.enum";

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly layer: LayerType;

  isRecoverable(): boolean;
  getSeverity(): Severity;
  toJSON(): Record<string, unknown>;
}

export function createValidationError(message: string): ValidationError {
  const timestamp = new Date();
  return {
    code: "VALIDATION_ERROR",
    message,
    timestamp,
    layer: LayerType.DOMAIN,
    isRecoverable(): boolean {
      return false;
    },
    getSeverity(): Severity {
      return Severity.ERROR;
    },
    toJSON(): Record<string, unknown> {
      return {
        code: "VALIDATION_ERROR",
        message,
        timestamp: timestamp.toISOString(),
        layer: LayerType.DOMAIN,
        severity: Severity.ERROR,
        recoverable: false,
      };
    },
  };
}
