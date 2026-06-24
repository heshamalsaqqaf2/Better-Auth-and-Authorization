import { ContainerModule } from "inversify";
import { BetterAuthService } from "@/Modules/Authentication/Infrastructure/Services";
import { AUTH_TOKENS } from "./tokens";

export const authContainerModule = new ContainerModule(({ bind }) => {
  bind(AUTH_TOKENS.BETTER_AUTH_SERVICE).to(BetterAuthService).inSingletonScope();
  // 08-05: SignInUseCase, SignUpUseCase, SignOutUseCase, GetSessionQuery
  // 08-06: DrizzleAuthQueryRepository
});
