import type { DomainResult } from "@/Core/Foundations/Domain/Results";
import type { AuthenticatedUser } from "../../Aggregates/authenticated-user";

export interface AuthQueryRepository {
  findByEmail(email: string): Promise<DomainResult<AuthenticatedUser | null>>;
  findById(id: string): Promise<DomainResult<AuthenticatedUser | null>>;
}
