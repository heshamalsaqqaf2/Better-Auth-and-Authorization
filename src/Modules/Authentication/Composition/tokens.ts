export const AUTH_TOKENS = {
  BETTER_AUTH_INSTANCE: Symbol.for("Auth.BetterAuthInstance"),
  BETTER_AUTH_SERVICE: Symbol.for("Auth.BetterAuthService"),
  HEADERS_PROVIDER: Symbol.for("Auth.HeadersProvider"),
  SIGN_IN_USE_CASE: Symbol.for("Auth.SignInUseCase"),
  SIGN_UP_USE_CASE: Symbol.for("Auth.SignUpUseCase"),
  SIGN_OUT_USE_CASE: Symbol.for("Auth.SignOutUseCase"),
  GET_SESSION_QUERY: Symbol.for("Auth.GetSessionQuery"),
  QUERY_AUTH_REPOSITORY: Symbol.for("Auth.AuthQueryRepository"),
  DRIZZLE_CLIENT: Symbol.for("Infra.DrizzleClient"),
} as const;
