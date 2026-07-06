import { ContainerModule } from "inversify";
import { auth } from "@/Lib/BetterAuth/Config/server";
import { SignInUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-in.use-case";
import { SignOutUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-out.use-case";
import { SignUpUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-up.use-case";
import { GetSessionQuery } from "@/Modules/Authentication/Application/UseCases/Queries/get-session.use-case";
import { BetterAuthService } from "@/Modules/Authentication/Infrastructure/Services";
import { AUTH_TOKENS } from "./tokens";

export const authContainerModule = new ContainerModule(({ bind }) => {
  bind(AUTH_TOKENS.BETTER_AUTH_INSTANCE).toConstantValue(auth);
  bind(AUTH_TOKENS.BETTER_AUTH_SERVICE).to(BetterAuthService).inSingletonScope();

  // UseCases — transient default scope (no .inSingletonScope()) per D-17
  bind(AUTH_TOKENS.SIGN_IN_USE_CASE).to(SignInUseCase);
  bind(AUTH_TOKENS.SIGN_UP_USE_CASE).to(SignUpUseCase);
  bind(AUTH_TOKENS.SIGN_OUT_USE_CASE).to(SignOutUseCase);
  bind(AUTH_TOKENS.GET_SESSION_QUERY).to(GetSessionQuery);

  // 08-06: DrizzleAuthQueryRepository
});
