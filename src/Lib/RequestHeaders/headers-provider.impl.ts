import { injectable } from "inversify";
import type { HeadersProvider } from "@/Core/Foundations/Infrastructure/Contracts/headers-provider.contract";
import { getContextHeaders } from "./store";

@injectable()
export class AsyncLocalHeadersProvider implements HeadersProvider {
  getHeaders(): Headers {
    return getContextHeaders();
  }
}
