export interface SignInDTO {
  email: string;
  password: string;
}

export interface SignUpDTO {
  name: string;
  email: string;
  password: string;
}

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

export interface SignOutDTO {
  headers: Headers;
}

export interface SessionCheckDTO {
  headers?: Headers | undefined;
  user: UserDTO | null;
  session: SessionDTO | null;
}
