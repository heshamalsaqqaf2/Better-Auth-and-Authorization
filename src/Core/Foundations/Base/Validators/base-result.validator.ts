import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { ResultBase } from "@/Core/Kernel/Contracts/Base/result-base.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import type { ResultValidator } from "@/Core/Kernel/Contracts/Validators/result-validator.contract";

export class BaseResultValidator
  implements ResultValidator<ResultBase<unknown, ErrorBase>>
{
  validate(result: ResultBase<unknown, ErrorBase>): ValidationResult {
    const errors: string[] = [];

    if (result === null || result === undefined) {
      errors.push("result is null or undefined");
      return { isValid: false, errors };
    }

    if (typeof result.isSuccess !== "boolean") {
      errors.push("isSuccess must be a boolean");
    }

    if (typeof result.isFailure !== "boolean") {
      errors.push("isFailure must be a boolean");
    }

    if (!("data" in result)) {
      errors.push("data property must exist");
    }

    if (!("error" in result)) {
      errors.push("error property must exist");
    }

    if (typeof result.map !== "function") {
      errors.push("map must be a function");
    }

    if (typeof result.flatMap !== "function") {
      errors.push("flatMap must be a function");
    }

    if (typeof result.match !== "function") {
      errors.push("match must be a function");
    }

    if (typeof result.fold !== "function") {
      errors.push("fold must be a function");
    }

    if (typeof result.tap !== "function") {
      errors.push("tap must be a function");
    }

    if (typeof result.tapError !== "function") {
      errors.push("tapError must be a function");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(result: ResultBase<unknown, ErrorBase>): boolean {
    return this.validate(result).isValid;
  }
}
