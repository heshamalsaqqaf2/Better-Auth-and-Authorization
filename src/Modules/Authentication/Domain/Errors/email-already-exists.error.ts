import { DomainError } from "@/Core/Foundations/Domain/Errors";
import { AUTH_ERROR_CODES } from "../Common/Constants/error-codes.constants";

export class EmailAlreadyExistsError extends DomainError {
  constructor(message: string, businessRule: string, aggregateId: string, cause?: DomainError) {
    super(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS, message, businessRule, aggregateId, cause);
  }
}
