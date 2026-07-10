"use server";

import { resolve } from "@/CompositionRoot";
import type { RequestContext } from "@/Core/Foundations/Application/Contracts/request-context.contract";
import {
  createSystemError,
  failureResult,
  mapApplicationToPresentationError,
  PRESENTATION_ERROR_CODES,
  type PresentationResult,
  successResult,
} from "@/Core/Foundations/Presentation";
import { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import { createOperationId } from "@/Core/Kernel/Primitives/Types/operation-id.type";
import { withRequestContextFromHeaders } from "@/Lib/RequestContext/from-headers";
import { getCorrelationId } from "@/Lib/RequestContext/store";
import type { SignOutUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-out.use-case";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";

export async function signOutAction(): Promise<PresentationResult<null>> {
  try {
    return await withRequestContextFromHeaders(async () => {
      const ctx: RequestContext = { correlationId: getCorrelationId()! };
      const useCase = resolve<SignOutUseCase>(AUTH_TOKENS.SIGN_OUT_USE_CASE);
      const result = await useCase.execute(undefined, ctx);
      return result.match<PresentationResult<null>>({
        onSuccess: () => successResult(null, createOperationId("SignOut")),
        onFailure: (error) => failureResult(mapApplicationToPresentationError(error), createOperationId("SignOut")),
      });
    });
  } catch {
    return failureResult(
      createSystemError(
        PRESENTATION_ERROR_CODES.INTERNAL_ERROR,
        "Failed to sign out. Please try again.",
        Severity.CRITICAL,
      ),
      createOperationId("SignOut"),
    );
  }
}
