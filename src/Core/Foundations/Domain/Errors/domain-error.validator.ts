import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { DomainErrorContract } from "../Contracts/domain-error.contract";

export class DomainErrorValidator
  implements ErrorValidator<DomainErrorContract>
{
  validate(error: DomainErrorContract): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (error.layer !== LayerType.DOMAIN) {
      errors.push("layer must be DOMAIN");
    }

    if (
      typeof error.businessRule !== "string" ||
      error.businessRule.length === 0
    ) {
      errors.push("businessRule must be a non-empty string");
    }

    if (typeof error.aggregateId !== "string") {
      errors.push("aggregateId must be a string");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: DomainErrorContract): boolean {
    return this.validate(error).isValid;
  }
}
