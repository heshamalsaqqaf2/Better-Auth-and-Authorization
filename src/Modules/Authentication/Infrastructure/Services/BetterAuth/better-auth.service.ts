import { inject, injectable } from "inversify";

import { err, ok } from "@/Core/Foundations/Base/Abstracts/result-base";
import { InfrastructureError } from "@/Core/Foundations/Infrastructure/Errors/infrastructure-error";
import { INFRASTRUCTURE_ERROR_CODES } from "@/Core/Foundations/Infrastructure/Errors/infrastructure-error-codes";
import { ApiTimeoutError } from "@/Core/Foundations/Infrastructure/Errors/Specific/api-timeout.error";
import { withRetry } from "@/Core/Foundations/Infrastructure/Resilience/with-retry";
import { withTimeout } from "@/Core/Foundations/Infrastructure/Resilience/with-timeout";
import type { InfrastructureResult } from "@/Core/Foundations/Infrastructure/Results/infrastructure-result";
import type { AuthServer } from "@/Lib/BetterAuth/Config/server";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";
import { AUTH_INFRA_ERROR_CODES } from "../../Common/Constants/error-codes.constants";
import type { SessionData, SessionUser, UserData } from "../../Common/Types";

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const DEFAULT_SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000;

@injectable()
class BetterAuthService {
  constructor(@inject(AUTH_TOKENS.BETTER_AUTH_INSTANCE) private readonly authInstance: AuthServer) {}

  async signIn(email: string, password: string): Promise<InfrastructureResult<SessionData>> {
    const result = await withRetry(
      () =>
        withTimeout(() => this.authInstance.api.signInEmail({ body: { email, password } }), TIMEOUT_MS, {
          systemComponent: "Network",
          errorCode: INFRASTRUCTURE_ERROR_CODES.API_TIMEOUT_ERROR,
        }),
      MAX_RETRIES,
      {
        systemComponent: "Network",
        errorCode: AUTH_INFRA_ERROR_CODES.AUTH_RETRY_EXHAUSTED,
      },
    );

    return result.match<InfrastructureResult<SessionData>>({
      onSuccess: (data) => ok(this.toSessionData(data.user, data.token)),
      onFailure: (error) => err(this.toInfrastructureError(error)),
    });
  }

  async signUp(name: string, email: string, password: string): Promise<InfrastructureResult<UserData>> {
    const result = await withRetry(
      () =>
        withTimeout(() => this.authInstance.api.signUpEmail({ body: { name, email, password } }), TIMEOUT_MS, {
          systemComponent: "Network",
          errorCode: AUTH_INFRA_ERROR_CODES.AUTH_API_TIMEOUT,
        }),
      MAX_RETRIES,
      {
        systemComponent: "Network",
        errorCode: AUTH_INFRA_ERROR_CODES.AUTH_RETRY_EXHAUSTED,
      },
    );

    return result.match<InfrastructureResult<UserData>>({
      onSuccess: (data) => ok(data.user as UserData),
      onFailure: (error) => err(this.toInfrastructureError(error)),
    });
  }

  async signOut(headers: Headers): Promise<InfrastructureResult<void>> {
    const result = await withTimeout(() => this.authInstance.api.signOut({ headers }), TIMEOUT_MS, {
      systemComponent: "Network",
      errorCode: AUTH_INFRA_ERROR_CODES.AUTH_API_TIMEOUT,
    });

    return result.match<InfrastructureResult<void>>({
      onSuccess: () => ok(undefined),
      onFailure: (error) => err(this.toInfrastructureError(error)),
    });
  }

  async getSession(headers: Headers): Promise<InfrastructureResult<SessionData | null>> {
    const result = await withTimeout(() => this.authInstance.api.getSession({ headers }), TIMEOUT_MS, {
      systemComponent: "Network",
      errorCode: AUTH_INFRA_ERROR_CODES.AUTH_SESSION_FAILED,
    });

    return result.match<InfrastructureResult<SessionData | null>>({
      onSuccess: (data) => (data ? ok(this.toSessionData(data.user, data.session.token)) : ok(null)),
      onFailure: (error) => err(this.toInfrastructureError(error)),
    });
  }

  private toSessionData(user: SessionUser, token: string): SessionData {
    return {
      session: {
        id: user.id,
        userId: user.id,
        expiresAt: new Date(Date.now() + DEFAULT_SESSION_EXPIRY_MS),
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
        code: AUTH_INFRA_ERROR_CODES.AUTH_UNKNOWN_ERROR,
        message: "Unknown auth error",
        systemComponent: "Network",
      });
    }

    const code = error.code;
    const message = error.message;

    if (
      code === INFRASTRUCTURE_ERROR_CODES.API_TIMEOUT_ERROR ||
      code === AUTH_INFRA_ERROR_CODES.AUTH_API_TIMEOUT ||
      code === AUTH_INFRA_ERROR_CODES.AUTH_SESSION_FAILED
    ) {
      return new ApiTimeoutError({ message, cause: error });
    }

    return new InfrastructureError({
      code: AUTH_INFRA_ERROR_CODES.AUTH_UNKNOWN_ERROR,
      message,
      systemComponent: "Network",
      cause: error,
    });
  }
}

export default BetterAuthService;
