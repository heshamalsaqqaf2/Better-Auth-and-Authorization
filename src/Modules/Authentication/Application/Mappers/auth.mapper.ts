import type { AuthenticatedUser, AuthSession } from "@/Modules/Authentication/Domain/Aggregates";
import type { AuthResponseDTO, SessionDTO, UserDTO } from "../DTOs/auth.dto";

export function mapUserAggregateToDTO(user: AuthenticatedUser): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function mapSessionAggregateToDTO(session: AuthSession): SessionDTO {
  return {
    id: session.id,
    expiresAt: session.expiresAt.toISOString(),
  };
}

export function mapAuthResultToResponse(user: AuthenticatedUser, session: AuthSession): AuthResponseDTO {
  return {
    user: mapUserAggregateToDTO(user),
    session: mapSessionAggregateToDTO(session),
  };
}
