import type { ApplicationResult } from "../Results/application-result";
import type { RequestContext } from "./request-context.contract";

export interface ICommandHandler<TCommand, TResult> {
  execute(
    command: TCommand,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
