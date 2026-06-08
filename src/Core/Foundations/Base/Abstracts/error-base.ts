import type { ErrorBase as ErrorBaseContract } from "../../../Kernel/Contracts/Base/error-base.contract";
import type { LayerType } from "../../../Kernel/Primitives/Enums/layer-type.enum";
import type { Severity as SeverityType } from "../../../Kernel/Primitives/Enums/severity.enum";
import { Severity } from "../../../Kernel/Primitives/Enums/severity.enum";

export abstract class ErrorBase implements ErrorBaseContract {
  readonly timestamp: Date = new Date();
  readonly cause?: ErrorBaseContract;

  constructor(
    readonly layer: LayerType,
    readonly code: string,
    readonly message: string,
    cause?: ErrorBaseContract,
  ) {
    if (cause !== undefined) {
      (this as { cause: ErrorBaseContract }).cause = cause;
    }
  }

  isRecoverable(): boolean {
    return false;
  }

  getSeverity(): SeverityType {
    return Severity.ERROR;
  }

  toJSON(): Record<string, unknown> {
    const visited = new Set<object>();
    return toJSONInternal(this, visited) as Record<string, unknown>;
  }
}

function toJSONInternal(value: unknown, visited: Set<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (visited.has(value as object)) {
    return "[Circular]";
  }

  visited.add(value as object);

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof ErrorBase) {
    const base = value as ErrorBaseContract;
    return {
      code: base.code,
      message: base.message,
      timestamp: base.timestamp.toISOString(),
      layer: base.layer,
      severity: base.getSeverity(),
      recoverable: base.isRecoverable(),
      cause: base.cause ? toJSONInternal(base.cause, visited) : undefined,
    };
  }

  return value;
}
