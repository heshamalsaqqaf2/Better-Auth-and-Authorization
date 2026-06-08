import { DomainError } from "../domain-error";

export class ComplaintAlreadyExistsError extends DomainError {
  constructor(
    message: string,
    businessRule: string,
    aggregateId: string,
    cause?: DomainError,
  ) {
    super("COMPLAINT_ALREADY_EXISTS", message, businessRule, aggregateId, cause);
  }
}
