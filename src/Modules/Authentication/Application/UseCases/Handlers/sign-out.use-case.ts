import { inject, injectable } from "inversify";
import type { ICommandHandler } from "@/Core/Foundations/Application/Contracts/command-handler.contract";
import type { RequestContext } from "@/Core/Foundations/Application/Contracts/request-context.contract";
import { UseCaseExecutionError } from "@/Core/Foundations/Application/Errors/Specific/use-case-execution.error";
import type { ApplicationResult } from "@/Core/Foundations/Application/Results/application-result";
import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { mapInfrastructureToAppError } from "@/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";
import type { BetterAuthService } from "@/Modules/Authentication/Infrastructure/Services";
import type { SignOutCommandDTO } from "../../DTOs/auth.dto";

@injectable()
export class SignOutUseCase implements ICommandHandler<SignOutCommandDTO, void> {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_SERVICE) private readonly authService: BetterAuthService) {}

  async execute(dto: SignOutCommandDTO, ctx: RequestContext): Promise<ApplicationResult<void>> {
    try {
      const result = await this.authService.signOut(dto.headers);

      return result.match<ApplicationResult<void>>({
        onSuccess: () => ok(undefined),
        onFailure: (error) =>
          err(
            mapInfrastructureToAppError(error, {
              operationName: "SignOut",
              correlationId: ctx.correlationId,
            }),
          ),
      });
    } catch (error) {
      return err(
        new UseCaseExecutionError({
          cause: (error instanceof Error ? error : new Error(String(error))) as unknown as ErrorBaseContract,
          operationName: "SignOut",
          correlationId: ctx.correlationId,
        }),
      );
    }
  }
}
