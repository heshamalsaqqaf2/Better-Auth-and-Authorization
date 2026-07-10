import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { DOMAIN_ERROR_CODES, DomainError } from "@/Core/Foundations/Domain/Errors";
import type { DomainResult } from "@/Core/Foundations/Domain/Results";
import { INFRASTRUCTURE_ERROR_CODES } from "@/Core/Foundations/Infrastructure/Errors/infrastructure-error-codes";
import { DatabaseQueryError } from "@/Core/Foundations/Infrastructure/Errors/Specific/database-query.error";
import { withRetry } from "@/Core/Foundations/Infrastructure/Resilience/with-retry";
import { withTimeout } from "@/Core/Foundations/Infrastructure/Resilience/with-timeout";
import { AUTH_TOKENS, type DrizzleClient } from "@/Modules/Authentication/Composition/tokens";
import type { AuthenticatedUser } from "@/Modules/Authentication/Domain/Aggregates/authenticated-user";
import type { AuthQueryRepository } from "@/Modules/Authentication/Domain/Repositories/Queries/auth-query.repository";
import { user } from "@/Modules/Authentication/Infrastructure/Database/Schema/user.schema";
import { mapUserRowToAggregate } from "../../Mappers/drizzle-to-domain.mapper";

type DomainAuthResult = DomainResult<AuthenticatedUser | null>;

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@injectable()
export class DrizzleAuthQueryRepository implements AuthQueryRepository {
  constructor(@inject(AUTH_TOKENS.DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async findByEmail(email: string): Promise<DomainAuthResult> {
    try {
      const result = await withRetry(
        () =>
          withTimeout(() => this.db.select().from(user).where(eq(user.email, email)).limit(1), 10_000, {
            systemComponent: "Database",
            errorCode: INFRASTRUCTURE_ERROR_CODES.OPERATION_TIMEOUT,
          }),
        3,
        { systemComponent: "Database", errorCode: INFRASTRUCTURE_ERROR_CODES.RETRY_EXHAUSTED },
      );

      return result.match<DomainAuthResult>({
        onSuccess: (rows) => ok(rows[0] ? mapUserRowToAggregate(rows[0]) : null),
        onFailure: (error) =>
          err(
            new DomainError(
              DOMAIN_ERROR_CODES.REPOSITORY_ERROR,
              `Failed to find user by email: ${error.message}`,
              "USER_LOOKUP",
              email,
              error,
            ),
          ),
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      return err(
        new DomainError(
          DOMAIN_ERROR_CODES.REPOSITORY_ERROR,
          `Unexpected error finding user by email: ${message}`,
          "USER_LOOKUP",
          email,
          new DatabaseQueryError({ message }),
        ),
      );
    }
  }

  async findById(id: string): Promise<DomainAuthResult> {
    try {
      const result = await withRetry(
        () =>
          withTimeout(() => this.db.select().from(user).where(eq(user.id, id)).limit(1), 10_000, {
            systemComponent: "Database",
            errorCode: INFRASTRUCTURE_ERROR_CODES.OPERATION_TIMEOUT,
          }),
        3,
        { systemComponent: "Database", errorCode: INFRASTRUCTURE_ERROR_CODES.RETRY_EXHAUSTED },
      );

      return result.match<DomainAuthResult>({
        onSuccess: (rows) => ok(rows[0] ? mapUserRowToAggregate(rows[0]) : null),
        onFailure: (error) =>
          err(
            new DomainError(
              DOMAIN_ERROR_CODES.REPOSITORY_ERROR,
              `Failed to find user by id: ${error.message}`,
              "USER_LOOKUP",
              id,
              error,
            ),
          ),
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      return err(
        new DomainError(
          DOMAIN_ERROR_CODES.REPOSITORY_ERROR,
          `Unexpected error finding user by id: ${message}`,
          "USER_LOOKUP",
          id,
          new DatabaseQueryError({ message }),
        ),
      );
    }
  }
}
