import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import { defineErrorCode, type ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

export interface ValidationError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly timestamp: Date;
  readonly layer: LayerType;

  isRecoverable(): boolean;
  getSeverity(): Severity;
  toJSON(): Record<string, unknown>;
}

const DEFAULT_VALIDATION_CODE = defineErrorCode("VALIDATION_ERROR");
const DEFAULT_LAYER = LayerType.DOMAIN;
const DEFAULT_SEVERITY = Severity.ERROR;
const DEFAULT_RECOVERABLE = false;

export interface CreateValidationErrorOptions {
  code?: ErrorCode;
  layer?: LayerType;
  severity?: Severity;
  recoverable?: boolean;
}

export function createValidationError(message: string, options: CreateValidationErrorOptions = {}): ValidationError {
  const {
    code = DEFAULT_VALIDATION_CODE,
    layer = DEFAULT_LAYER,
    severity = DEFAULT_SEVERITY,
    recoverable = DEFAULT_RECOVERABLE,
  } = options;
  const timestamp = new Date();

  const error: ValidationError = {
    code,
    message,
    timestamp,
    layer,

    isRecoverable(): boolean {
      return recoverable;
    },
    getSeverity(): Severity {
      return severity;
    },
    toJSON(): Record<string, unknown> {
      return {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        layer: this.layer,
        severity: this.getSeverity(),
        recoverable: this.isRecoverable(),
      };
    },
  };
  return Object.freeze(error);
}
