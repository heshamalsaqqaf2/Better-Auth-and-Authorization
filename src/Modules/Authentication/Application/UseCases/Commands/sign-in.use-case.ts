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
import type { AuthResponseDTO, SignInDTO } from "../../DTOs/auth.dto";

@injectable()
export class SignInUseCase implements ICommandHandler<SignInDTO, AuthResponseDTO> {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_SERVICE) private readonly authService: BetterAuthService) {}

  async execute(dto: SignInDTO, ctx: RequestContext): Promise<ApplicationResult<AuthResponseDTO>> {
    try {
      const result = await this.authService.signIn(dto.email, dto.password);

      if (result.isFailure) {
        return err(
          mapInfrastructureToAppError(result.error!, {
            operationName: "SignIn",
            correlationId: ctx.correlationId,
          }),
        );
      }

      const data = result.data!;
      return ok({
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        },
        session: {
          id: data.session.id,
          expiresAt: data.session.expiresAt.toISOString(),
        },
      });
    } catch (error) {
      return err(
        new UseCaseExecutionError({
          cause: (error instanceof Error ? error : new Error(String(error))) as unknown as ErrorBaseContract,
          operationName: "SignIn",
          correlationId: ctx.correlationId,
        }),
      );
    }
  }
}
