import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import { isCorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import type { ApplicationErrorContract } from "../Contracts/application-error.contract";

export class ApplicationErrorValidator implements ErrorValidator<ApplicationErrorContract> {
  validate(error: ApplicationErrorContract): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (error.layer !== LayerType.APPLICATION) {
      errors.push("layer must be APPLICATION");
    }

    if (typeof error.operationName !== "string" || error.operationName.length === 0) {
      errors.push("operationName must be a non-empty string");
    }

    if (!isCorrelationId(error.correlationId)) {
      errors.push("correlationId must be a non-empty string");
    }

    if (error.userId !== undefined && typeof error.userId !== "string") {
      errors.push("userId must be a string when provided");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: ApplicationErrorContract): boolean {
    return this.validate(error).isValid;
  }
}
