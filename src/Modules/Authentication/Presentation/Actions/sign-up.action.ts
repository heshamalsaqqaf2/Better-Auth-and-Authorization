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
import type { AuthResponseDTO, SignUpCommandDTO } from "@/Modules/Authentication/Application/DTOs/auth.dto";
import type { SignUpUseCase } from "@/Modules/Authentication/Application/UseCases/Handlers/sign-up.use-case";
import { AUTH_TOKENS } from "@/Modules/Authentication/Composition/tokens";

export async function signUpAction(
  prevState: PresentationResult<AuthResponseDTO | null>,
  formData: FormData,
): Promise<PresentationResult<AuthResponseDTO | null>> {
  try {
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;

    if (!name || !email || !password || password.length < 8) {
      const fieldErrors: Record<string, string[]> = {};
      if (!name) fieldErrors["name"] = ["Name is required"];
      if (!email) fieldErrors["email"] = ["Email is required"];
      if (!password) {
        fieldErrors["password"] = ["Password is required"];
      } else if (password.length < 8) {
        fieldErrors["password"] = ["Password must be at least 8 characters"];
      }
      return failureResult(
        createValidationError(PRESENTATION_ERROR_CODES.BAD_REQUEST, fieldErrors),
        createOperationId("SignUp"),
      );
    }

    const dto: SignUpCommandDTO = { name, email, password };

    return await withRequestContextFromHeaders(async () => {
      const ctx: RequestContext = { correlationId: requireCorrelationId() };
      const useCase = resolve<SignUpUseCase>(AUTH_TOKENS.SIGN_UP_USE_CASE);
      const result = await useCase.execute(dto, ctx);
      return mapApplicationToPresentationResult(result, { operationName: "SignUp" });
    });
  } catch {
    return failureResult(
      createSystemError(
        PRESENTATION_ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred. Please try again.",
        Severity.CRITICAL,
      ),
      createOperationId("SignUp"),
    );
  }
}
