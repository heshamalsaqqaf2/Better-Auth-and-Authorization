import { DomainError } from "../domain-error";

export class ComplaintNotFoundError extends DomainError {
  constructor(
    message: string,
    businessRule: string,
    aggregateId: string,
    cause?: DomainError,
  ) {
    super("COMPLAINT_NOT_FOUND", message, businessRule, aggregateId, cause);
  }
}
