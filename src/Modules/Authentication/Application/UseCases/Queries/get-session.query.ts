import { inject, injectable } from "inversify";
import type { IQueryHandler } from "@/Core/Foundations/Application/Contracts/query-handler.contract";
import type { RequestContext } from "@/Core/Foundations/Application/Contracts/request-context.contract";
import { UseCaseExecutionError } from "@/Core/Foundations/Application/Errors/Specific/use-case-execution.error";
import type { ApplicationResult } from "@/Core/Foundations/Application/Results/application-result";
import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { mapInfrastructureToAppError } from "@/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";
import type { BetterAuthService } from "@/Modules/Authentication/Infrastructure/Services";
import type { SessionCheckDTO } from "../../DTOs/auth.dto";

@injectable()
export class GetSessionQuery implements IQueryHandler<SessionCheckDTO, SessionCheckDTO> {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_SERVICE) private readonly authService: BetterAuthService) {}

  async execute(dto: SessionCheckDTO, ctx: RequestContext): Promise<ApplicationResult<SessionCheckDTO>> {
    try {
      const result = await this.authService.getSession(dto.headers!);

      if (result.isFailure) {
        return err(
          mapInfrastructureToAppError(result.error!, {
            operationName: "GetSession",
            correlationId: ctx.correlationId,
          }),
        );
      }

      const sessionData = result.data!;
      if (!sessionData) {
        return ok({ user: null, session: null });
      }

      return ok({
        user: {
          id: sessionData.user.id,
          name: sessionData.user.name,
          email: sessionData.user.email,
        },
        session: {
          id: sessionData.session.id,
          expiresAt: sessionData.session.expiresAt.toISOString(),
        },
      });
    } catch (error) {
      return err(
        new UseCaseExecutionError({
          cause: (error instanceof Error ? error : new Error(String(error))) as unknown as ErrorBaseContract,
          operationName: "GetSession",
          correlationId: ctx.correlationId,
        }),
      );
    }
  }
}
