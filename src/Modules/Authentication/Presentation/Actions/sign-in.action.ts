"use server";

import { resolve } from "@/CompositionRoot";
import type { RequestContext } from "@/Core/Foundations/Application/Contracts/request-context.contract";
import {
  createSystemError,
  createValidationError,
  failureResult,
  mapApplicationToPresentationResult,
  PRESENTATION_ERROR_CODES,
  type PresentationResult,
} from "@/Core/Foundations/Presentation";
import { Severity } from "@/Core/Kernel/Primitives/Enums/severity.enum";
import { createOperationId } from "@/Core/Kernel/Primitives/Types/operation-id.type";
import { withRequestContextFromHeaders } from "@/Lib/RequestContext/from-headers";
import { requireCorrelationId } from "@/Lib/RequestContext/store";
import type { AuthResponseDTO, SignInCommandDTO } from "@/Modules/Authentication/Application/DTOs/auth.dto";
import type { SignInUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-in.use-case";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";

export async function signInAction(
  prevState: PresentationResult<AuthResponseDTO | null>,
  formData: FormData,
): Promise<PresentationResult<AuthResponseDTO | null>> {
  try {
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;

    if (!email || !password) {
      const fieldErrors: Record<string, string[]> = {};
      if (!email) fieldErrors.email = ["Email is required"];
      if (!password) fieldErrors.password = ["Password is required"];
      return failureResult(
        createValidationError(PRESENTATION_ERROR_CODES.BAD_REQUEST, fieldErrors),
        createOperationId("SignIn"),
      );
    }

    const dto: SignInCommandDTO = { email, password };

    return await withRequestContextFromHeaders(async () => {
      const ctx: RequestContext = { correlationId: requireCorrelationId() };
      const useCase = resolve<SignInUseCase>(AUTH_TOKENS.SIGN_IN_USE_CASE);
      const result = await useCase.execute(dto, ctx);
      return mapApplicationToPresentationResult(result, { operationName: "SignIn" });
    });
  } catch {
    return failureResult(
      createSystemError(
        PRESENTATION_ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred. Please try again.",
        Severity.CRITICAL,
      ),
      createOperationId("SignIn"),
    );
  }
}
