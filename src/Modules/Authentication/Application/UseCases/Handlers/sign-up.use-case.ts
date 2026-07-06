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
import type { AuthResponseDTO, SignUpCommandDTO } from "../../DTOs/auth.dto";

@injectable()
export class SignUpUseCase implements ICommandHandler<SignUpCommandDTO, AuthResponseDTO> {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_SERVICE) private readonly authService: BetterAuthService) {}

  async execute(dto: SignUpCommandDTO, ctx: RequestContext): Promise<ApplicationResult<AuthResponseDTO>> {
    try {
      const result = await this.authService.signUp(dto.name, dto.email, dto.password);

      return result.match<ApplicationResult<AuthResponseDTO>>({
        onSuccess: (data) =>
          ok({
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
            },
            session: {
              id: "",
              expiresAt: new Date().toISOString(),
            },
          }),
        onFailure: (error) =>
          err(
            mapInfrastructureToAppError(error, {
              operationName: "SignUp",
              correlationId: ctx.correlationId,
            }),
          ),
      });
    } catch (error) {
      return err(
        new UseCaseExecutionError({
          cause: (error instanceof Error ? error : new Error(String(error))) as unknown as ErrorBaseContract,
          operationName: "SignUp",
          correlationId: ctx.correlationId,
        }),
      );
    }
  }
}
