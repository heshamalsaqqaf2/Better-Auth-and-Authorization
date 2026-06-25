import { DomainError } from "@/Core/Foundations/Domain";
import { AUTH_ERROR_CODES } from "../Constants/error-codes.constants";

export class UserNotFoundError extends DomainError {
  constructor(message: string, businessRule: string, aggregateId: string, cause?: DomainError) {
    super(AUTH_ERROR_CODES.USER_NOT_FOUND, message, businessRule, aggregateId, cause);
  }
}
