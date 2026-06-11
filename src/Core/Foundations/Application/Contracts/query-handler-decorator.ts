import type { ApplicationResult } from "../Results/application-result";
import type { IQueryHandler } from "./query-handler.contract";
import type { RequestContext } from "./request-context.contract";

export abstract class QueryHandlerDecorator<TQuery, TResult> implements IQueryHandler<TQuery, TResult> {
  constructor(protected readonly innerHandler: IQueryHandler<TQuery, TResult>) {}

  abstract execute(query: TQuery, ctx: RequestContext): Promise<ApplicationResult<TResult>>;
}
