import type { Container } from "../container";

export const TOKEN_BETTER_AUTH_SERVICE = "BetterAuthService";
export const TOKEN_SIGN_IN_USE_CASE = "SignInUseCase";
export const TOKEN_SIGN_UP_USE_CASE = "SignUpUseCase";
export const TOKEN_SIGN_OUT_USE_CASE = "SignOutUseCase";
export const TOKEN_GET_SESSION_QUERY = "GetSessionQuery";
export const TOKEN_COMMAND_AUTH_REPOSITORY = "ICommandAuthRepository";
export const TOKEN_QUERY_AUTH_REPOSITORY = "IQueryAuthRepository";

export function registerAuthBindings(_container: Container): void {
  // Bindings are registered during Wave 2 when auth module implementations exist.
}
