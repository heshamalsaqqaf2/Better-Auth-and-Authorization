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
