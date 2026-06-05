import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { DatabaseSchema } from "@/core/foundations/infrastructure/database";
import { db } from "@/core/foundations/infrastructure/database/server";

const authSchema = {
  user: DatabaseSchema.user,
  account: DatabaseSchema.account,
  session: DatabaseSchema.session,
  verificationToken: DatabaseSchema.verification,
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  appName: process.env.APPNAME,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
      disableIpTracking: false,
    },
    useSecureCookies: true,
    disableCSRFCheck: false,
    disableOriginCheck: false,
    crossSubDomainCookies: {
      enabled: true,
      additionalCookies: ["custom_cookie"],
      domain: "example.com",
    },
    cookies: {
      session_token: {
        name: "custom_session_token",
        attributes: {
          httpOnly: true,
          secure: true,
        },
      },
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
    },
    cookiePrefix: "myapp",
  },
  skipTrailingSlashes: true,
  trustedOrigins: [
    "https://example.com",
    "https://app.example.com",
    "http://localhost:3000",
  ],
  telemetry: {
    debug: true,
    enabled: true,
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      console.log(`[${level}] ${message}`, ...args);
    },
  },
  plugins: [nextCookies()],
});
