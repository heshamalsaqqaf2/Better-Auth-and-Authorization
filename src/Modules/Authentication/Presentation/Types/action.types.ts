import type { PresentationResult } from "@/Core/Foundations/Presentation/Results/presentation-result";
import type { AuthResponseDTO } from "@/Modules/Authentication/Application/DTOs/auth.dto";

export type SignInFormState = PresentationResult<AuthResponseDTO | null>;
export type SignUpFormState = PresentationResult<AuthResponseDTO | null>;
export type SignOutFormState = PresentationResult<null>;
