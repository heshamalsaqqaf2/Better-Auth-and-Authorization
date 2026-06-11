import type { ApplicationResult } from "../Results/application-result";
import type { ICommandHandler } from "./command-handler.contract";
import type { RequestContext } from "./request-context.contract";

export abstract class CommandHandlerDecorator<TCommand, TResult> implements ICommandHandler<TCommand, TResult> {
  constructor(protected readonly innerHandler: ICommandHandler<TCommand, TResult>) {}

  abstract execute(command: TCommand, ctx: RequestContext): Promise<ApplicationResult<TResult>>;
}
