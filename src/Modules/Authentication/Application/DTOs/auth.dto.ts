export type { SignInCommandDTO, SignUpCommandDTO } from "../Validators";

// ==== Response (Output) ====
export interface UserDTO {
  id: string;
  name: string;
  email: string;
}
export interface SessionDTO {
  id: string;
  expiresAt: string;
}
export interface AuthResponseDTO {
  user: UserDTO;
  session: SessionDTO;
}
export interface SessionResponseDTO {
  user: UserDTO | null;
  session: SessionDTO | null;
}
