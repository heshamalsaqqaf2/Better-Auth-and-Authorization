import { DomainError } from "../domain-error";

export class UserNotFoundError extends DomainError {
  constructor(
    message: string,
    businessRule: string,
    aggregateId: string,
    cause?: DomainError,
  ) {
    super("USER_NOT_FOUND", message, businessRule, aggregateId, cause);
  }
}
