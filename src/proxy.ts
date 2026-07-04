import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const X_CORRELATION_ID = "x-correlation-id";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

let _fallbackCounter = 0;

function generateCorrelationId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    _fallbackCounter++;
    return `fallback-${Date.now()}-${_fallbackCounter}`;
  }
}

export default function proxy(request: NextRequest): NextResponse {
  const correlationId = request.headers.get(X_CORRELATION_ID) ?? generateCorrelationId();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(X_CORRELATION_ID, correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(X_CORRELATION_ID, correlationId);

  return response;
}
