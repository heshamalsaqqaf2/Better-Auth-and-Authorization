import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { InfrastructureError } from "@/Core/Foundations/Infrastructure/Errors/infrastructure-error";
import { ApiTimeoutError } from "@/Core/Foundations/Infrastructure/Errors/Specific/api-timeout.error";
import { ApiUnavailableError } from "@/Core/Foundations/Infrastructure/Errors/Specific/api-unavailable.error";
import { withRetry } from "@/Core/Foundations/Infrastructure/Resilience/with-retry";
import { withTimeout } from "@/Core/Foundations/Infrastructure/Resilience/with-timeout";
import type { InfrastructureResult } from "@/Core/Foundations/Infrastructure/Results/infrastructure-result";
import { auth } from "@/Lib/BetterAuth/Config/server";

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: SessionUser;
}

export type UserData = SessionUser;

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

class BetterAuthService {
  async signIn(email: string, password: string): Promise<InfrastructureResult<SessionData>> {
    const result = await withRetry(
      () =>
        withTimeout(() => auth.api.signInEmail({ body: { email, password } }), TIMEOUT_MS, {
          systemComponent: "Network",
          errorCode: "AUTH_FAILED",
        }),
      MAX_RETRIES,
      { systemComponent: "Network", errorCode: "AUTH_RETRY_EXHAUSTED" },
    );

    return result.fold<InfrastructureResult<SessionData>>(
      (data) => ok(this.toSessionData(data.user, data.token)),
      (error) => err(this.toInfrastructureError(error)),
    );
  }

  async signUp(name: string, email: string, password: string): Promise<InfrastructureResult<UserData>> {
    const result = await withRetry(
      () =>
        withTimeout(() => auth.api.signUpEmail({ body: { name, email, password } }), TIMEOUT_MS, {
          systemComponent: "Network",
          errorCode: "AUTH_FAILED",
        }),
      MAX_RETRIES,
      { systemComponent: "Network", errorCode: "AUTH_RETRY_EXHAUSTED" },
    );

    return result.fold<InfrastructureResult<UserData>>(
      (data) => ok(data.user as UserData),
      (error) => err(this.toInfrastructureError(error)),
    );
  }

  async signOut(headers: Headers): Promise<InfrastructureResult<void>> {
    const result = await withTimeout(() => auth.api.signOut({ headers }), TIMEOUT_MS, {
      systemComponent: "Network",
      errorCode: "SIGNOUT_FAILED",
    });

    return result.fold<InfrastructureResult<void>>(
      () => ok(undefined),
      (error) => err(this.toInfrastructureError(error)),
    );
  }

  async getSession(headers: Headers): Promise<InfrastructureResult<SessionData | null>> {
    const result = await withTimeout(() => auth.api.getSession({ headers }), TIMEOUT_MS, {
      systemComponent: "Network",
      errorCode: "SESSION_FAILED",
    });

    return result.fold<InfrastructureResult<SessionData | null>>(
      (data) => (data ? ok(this.toSessionData(data.user, data.session.token)) : ok(null)),
      (error) => err(this.toInfrastructureError(error)),
    );
  }

  private toSessionData(user: SessionUser, token: string): SessionData {
    return {
      session: {
        id: user.id,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        token,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      user,
    };
  }

  private toInfrastructureError(error?: InfrastructureError): InfrastructureError {
    if (!error) {
      return new InfrastructureError({
        code: "UNKNOWN_ERROR",
        message: "Unknown auth error",
        systemComponent: "Network",
      });
    }

    const code = error.code;
    const message = error.message;

    if (code === "AUTH_FAILED" || code === "TIMEOUT") {
      return new ApiTimeoutError({ message, cause: error });
    }

    if (code?.startsWith("5")) {
      return new ApiUnavailableError({ message, cause: error, retryStrategy: "exponential" });
    }

    return new InfrastructureError({
      code: "UNKNOWN_ERROR",
      message,
      systemComponent: "Network",
      cause: error,
    });
  }
}

export default BetterAuthService;
