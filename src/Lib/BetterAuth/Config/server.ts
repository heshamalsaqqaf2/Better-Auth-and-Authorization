import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { databaseServer } from "@/Lib/Drizzle/Database/connection";

export const auth = betterAuth({
  database: drizzleAdapter(databaseServer, {
    provider: "pg",
  }),
  appName: process.env.APPNAME,
  secret: process.env.BETTER_AUTH_SECRET,
});
