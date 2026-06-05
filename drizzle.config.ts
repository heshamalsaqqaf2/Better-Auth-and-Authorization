import "dotenv/config";
import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: resolve(__dirname, ".env.local") });

if (!process.env.DATABASE_URL)
  throw new Error("❌Not Found 'URL: process.env.DATABASE_URL'");

export default defineConfig({
  dialect: "postgresql",
  extensionsFilters: ["postgis"],
  out: "./src/core/foundations/infrastructure/database/drizzle/migrations",
  schema: "./src/core/foundations/infrastructure/database/schema/index.ts",
  dbCredentials: { url: process.env.DATABASE_URL },
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  strict: true,
  verbose: true,
});
