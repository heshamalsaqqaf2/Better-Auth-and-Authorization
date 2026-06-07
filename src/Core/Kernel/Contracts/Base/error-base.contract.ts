import type { LayerType } from "../../Primitives/Enums/layer-type.enum";
import type { Severity } from "../../Primitives/Enums/severity.enum";

export interface ErrorBase {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly layer: LayerType;
  readonly cause?: ErrorBase;

  isRecoverable(): boolean;
  getSeverity(): Severity;
  toJSON(): Record<string, unknown>;
}
