import { DomainError } from "@/Core/Foundations/Domain";
import { AUTH_ERROR_CODES } from "./error-codes.constants";

export class AuthenticationFailedError extends DomainError {
  constructor(message: string, businessRule: string, aggregateId: string, cause?: DomainError) {
    super(AUTH_ERROR_CODES.AUTH_FAILED, message, businessRule, aggregateId, cause);
  }
}
