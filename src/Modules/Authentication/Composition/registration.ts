import type { Container } from "@/CompositionRoot/container";
import { AUTH_TOKENS } from "./tokens";

export function registerAuthBindings(container: Container): void {
  container.bind(AUTH_TOKENS.BETTER_AUTH_SERVICE, () => {
    throw new Error("BetterAuthService not yet implemented");
  });
  container.bind(AUTH_TOKENS.SIGN_IN_USE_CASE, () => {
    throw new Error("SignInUseCase not yet implemented");
  });
  container.bind(AUTH_TOKENS.SIGN_UP_USE_CASE, () => {
    throw new Error("SignUpUseCase not yet implemented");
  });
  container.bind(AUTH_TOKENS.SIGN_OUT_USE_CASE, () => {
    throw new Error("SignOutUseCase not yet implemented");
  });
  container.bind(AUTH_TOKENS.GET_SESSION_QUERY, () => {
    throw new Error("GetSessionQuery not yet implemented");
  });
  container.bind(AUTH_TOKENS.COMMAND_AUTH_REPOSITORY, () => {
    throw new Error("ICommandAuthRepository not yet implemented");
  });
  container.bind(AUTH_TOKENS.QUERY_AUTH_REPOSITORY, () => {
    throw new Error("IQueryAuthRepository not yet implemented");
  });
}
