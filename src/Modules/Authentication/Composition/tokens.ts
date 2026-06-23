export const AUTH_TOKENS = {
  BETTER_AUTH_SERVICE: Symbol.for("Auth.BetterAuthService"),
  SIGN_IN_USE_CASE: Symbol.for("Auth.SignInUseCase"),
  SIGN_UP_USE_CASE: Symbol.for("Auth.SignUpUseCase"),
  SIGN_OUT_USE_CASE: Symbol.for("Auth.SignOutUseCase"),
  GET_SESSION_QUERY: Symbol.for("Auth.GetSessionQuery"),
  COMMAND_AUTH_REPOSITORY: Symbol.for("Auth.ICommandAuthRepository"),
  QUERY_AUTH_REPOSITORY: Symbol.for("Auth.IQueryAuthRepository"),
} as const;
