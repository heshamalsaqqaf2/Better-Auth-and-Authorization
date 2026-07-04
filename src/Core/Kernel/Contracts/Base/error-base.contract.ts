import type { LayerType } from "../../Primitives/Enums/layer-type.enum";
import type { Severity } from "../../Primitives/Enums/severity.enum";
import type { ErrorCode } from "../../Primitives/Types/error-code.type";

export interface ErrorBase {
  readonly code: ErrorCode;
  readonly message: string;
  readonly timestamp: Date;
  readonly layer: LayerType;
  readonly cause?: ErrorBase;

  isRecoverable(): boolean;
  getSeverity(): Severity;
  toJSON(): Record<string, unknown>;
}
