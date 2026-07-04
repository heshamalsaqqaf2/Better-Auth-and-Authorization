import { headers } from "next/headers";
import { createCorrelationId } from "@/Core/Foundations/Types";
import { withRequestContext } from "./init";

export async function withRequestContextFromHeaders<T>(fn: () => Promise<T>): Promise<T> {
  const headersList = await headers();
  const rawId = headersList.get("x-correlation-id") ?? crypto.randomUUID();
  return withRequestContext(createCorrelationId(rawId), fn);
}
