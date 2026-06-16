import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { InfrastructureErrorContract } from "../Contracts/infrastructure-error.contract";

export class InfrastructureErrorValidator implements ErrorValidator<InfrastructureErrorContract> {
  validate(error: InfrastructureErrorContract): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (error.layer !== LayerType.INFRASTRUCTURE) {
      errors.push("layer must be INFRASTRUCTURE");
    }

    if (typeof error.systemComponent !== "string" || error.systemComponent.length === 0) {
      errors.push("systemComponent must be a non-empty string");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: InfrastructureErrorContract): boolean {
    return this.validate(error).isValid;
  }
}
