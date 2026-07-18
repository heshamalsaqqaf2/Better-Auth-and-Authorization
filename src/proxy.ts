import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const X_CORRELATION_ID = "x-correlation-id";
let _fallbackCounter = 0;

function generateCorrelationId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    _fallbackCounter++;
    return `fallback-${Date.now()}-${_fallbackCounter}`;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse<unknown>> {
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
export const config = {
  matcher: ["/dashboard"], // Specify the routes the middleware applies to
};

// import { headers } from "next/headers";
// import { type NextRequest, NextResponse } from "next/server";
// import { auth } from "./Lib/BetterAuth/Config/server";

// export async function proxy(request: NextRequest) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session) {
//     return NextResponse.redirect(new URL("/sign-in", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard"], // Specify the routes the middleware applies to
// };
