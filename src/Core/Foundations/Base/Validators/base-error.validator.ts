import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LAYER_TYPE_VALUES } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";

export class BaseErrorValidator implements ErrorValidator<ErrorBase> {
  validate(error: ErrorBase): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (typeof error.code !== "string") {
      errors.push("code must be a string");
    }

    if (typeof error.message !== "string") {
      errors.push("message must be a string");
    }

    if (typeof error.timestamp !== "object" || error.timestamp === null || typeof error.timestamp.getTime !== "function") {
      errors.push("timestamp must be a Date");
    }

    if (
      typeof error.layer !== "string" ||
      !LAYER_TYPE_VALUES.includes(error.layer)
    ) {
      errors.push("layer must be a valid LayerType");
    }

    if (typeof error.isRecoverable !== "function") {
      errors.push("isRecoverable must be a function");
    }

    if (typeof error.getSeverity !== "function") {
      errors.push("getSeverity must be a function");
    }

    if (typeof error.toJSON !== "function") {
      errors.push("toJSON must be a function");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: ErrorBase): boolean {
    return this.validate(error).isValid;
  }
}
