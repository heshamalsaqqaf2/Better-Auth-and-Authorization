import type { AuthenticatedUser } from "../../Domain/Aggregates/authenticated-user";
import type { user } from "../Database/Schema/user.schema";

export function mapUserRowToAggregate(row: typeof user.$inferSelect): AuthenticatedUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
