import { AsyncLocalStorage } from "node:async_hooks";

const headersStorage = new AsyncLocalStorage<Headers>();

export function runWithHeaders<T>(headers: Headers, fn: () => T): T {
  return headersStorage.run(headers, fn);
}

export function getContextHeaders(): Headers {
  const headers = headersStorage.getStore();
  if (!headers) {
    throw new Error("Headers not available in current context. Wrap with runWithHeaders().");
  }
  return headers;
}
