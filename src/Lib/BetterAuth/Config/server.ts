import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDatabaseClient } from "@/Lib/Drizzle/Config/drizzle.client";

const db = getDatabaseClient();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});

export type AuthServer = typeof auth;
