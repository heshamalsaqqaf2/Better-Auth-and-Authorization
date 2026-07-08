import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { inject, injectable } from "inversify";
import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import type { DomainResult } from "@/Core/Foundations/Domain/Results";
import { DatabaseQueryError } from "@/Core/Foundations/Infrastructure/Errors/Specific/database-query.error";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";
import type { AuthenticatedUser } from "@/Modules/Authentication/Domain/Aggregates/authenticated-user";
import type { AuthQueryRepository } from "@/Modules/Authentication/Domain/Repositories/Queries/auth-query.repository";
import type * as schema from "@/Modules/Authentication/Infrastructure/Database/Schema";
import { user } from "@/Modules/Authentication/Infrastructure/Database/Schema/user.schema";
import { mapUserRowToAggregate } from "../../Mappers/drizzle-to-domain.mapper";

type DrizzleClient = NodePgDatabase<typeof schema>;

@injectable()
export class DrizzleAuthQueryRepository implements AuthQueryRepository {
  constructor(@inject(AUTH_TOKENS.DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async findByEmail(email: string): Promise<DomainResult<AuthenticatedUser | null>> {
    try {
      const rows = await this.db.select().from(user).where(eq(user.email, email)).limit(1);
      const result = rows[0] ?? null;
      return ok<AuthenticatedUser | null>(result ? mapUserRowToAggregate(result) : null);
    } catch (error) {
      return err(
        new DatabaseQueryError({
          message: `Failed to find user by email: ${(error as Error).message}`,
          cause: error as any,
        }) as any,
      );
    }
  }

  async findById(id: string): Promise<DomainResult<AuthenticatedUser | null>> {
    try {
      const rows = await this.db.select().from(user).where(eq(user.id, id)).limit(1);
      const result = rows[0] ?? null;
      return ok<AuthenticatedUser | null>(result ? mapUserRowToAggregate(result) : null);
    } catch (error) {
      return err(
        new DatabaseQueryError({
          message: `Failed to find user by id: ${(error as Error).message}`,
          cause: error as any,
        }) as any,
      );
    }
  }
}
