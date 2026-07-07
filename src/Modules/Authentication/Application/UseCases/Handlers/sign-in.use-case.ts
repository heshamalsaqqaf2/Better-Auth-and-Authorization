import { inject, injectable } from "inversify";
import type { ICommandHandler } from "@/Core/Foundations/Application/Contracts/command-handler.contract";
import type { RequestContext } from "@/Core/Foundations/Application/Contracts/request-context.contract";
import { CommandValidationError } from "@/Core/Foundations/Application/Errors/Specific/command-validation.error";
import { UseCaseExecutionError } from "@/Core/Foundations/Application/Errors/Specific/use-case-execution.error";
import { formatZodErrors } from "@/Core/Foundations/Application/Helpers/validation.helper";
import type { ApplicationResult } from "@/Core/Foundations/Application/Results/application-result";
import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { mapInfrastructureToAppError } from "@/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";
import type { BetterAuthService } from "@/Modules/Authentication/Infrastructure/Services";
import type { AuthResponseDTO, SignInCommandDTO } from "../../DTOs/auth.dto";
import { SignInSchema } from "../../Validators";

@injectable()
export class SignInUseCase implements ICommandHandler<SignInCommandDTO, AuthResponseDTO> {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_SERVICE) private readonly authService: BetterAuthService) {}

  async execute(dto: SignInCommandDTO, ctx: RequestContext): Promise<ApplicationResult<AuthResponseDTO>> {
    const parsed = SignInSchema.safeParse(dto);
    if (!parsed.success) {
      return err(
        new CommandValidationError({
          operationName: "SignIn",
          correlationId: ctx.correlationId,
          fieldErrors: formatZodErrors(parsed.error),
        }),
      );
    }

    try {
      const result = await this.authService.signIn(parsed.data.email, parsed.data.password);

      return result.match<ApplicationResult<AuthResponseDTO>>({
        onSuccess: (data) =>
          ok({
            user: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
            },
            session: {
              id: data.session.id,
              expiresAt: data.session.expiresAt.toISOString(),
            },
          }),
        onFailure: (error) =>
          err(
            mapInfrastructureToAppError(error, {
              operationName: "SignIn",
              correlationId: ctx.correlationId,
            }),
          ),
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
