import type { ApplicationResult } from "../Results/application-result";
import type { RequestContext } from "./request-context.contract";

export interface IQueryHandler<TQuery, TResult> {
  execute(
    query: TQuery,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
