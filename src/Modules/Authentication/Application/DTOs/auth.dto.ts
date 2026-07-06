// ==== Commands (Input) ====
export interface SignInCommandDTO {
  email: string;
  password: string;
}
export interface SignUpCommandDTO {
  name: string;
  email: string;
  password: string;
}
export interface SignOutCommandDTO {
  headers: Headers;
}
// ==== Queries (Input) ====
export interface GetSessionQueryDTO {
  headers: Headers;
}
// ==== Responses (Output) ====
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
