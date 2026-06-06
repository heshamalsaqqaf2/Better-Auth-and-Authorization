/**
 * @file src/lib/drizzle/config/drizzle.config.ts
 * @description Drizzle Kit CLI Configuration
 */

import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// Load environment variables
const envPath = resolve(process.cwd(), ".env.local");
require("dotenv").config({ path: envPath });

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "❌ DATABASE_URL is not defined in .env.local\n" +
      "Please add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname",
  );
}

export default defineConfig({
  // Database dialect
  dialect: "postgresql",
  // Path to schema files (absolute path using resolve)
  schema: resolve(process.cwd(), "src/lib/drizzle/database/schema/index.ts"),
  // Output directory for migrations (absolute path)
  out: resolve(process.cwd(), "src/lib/drizzle/database/migrations"),
  // Database credentials
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Migration settings
  migrations: {
    prefix: "timestamp", // Use timestamp prefix: 20260606123456_migration_name.sql
    table: "__drizzle_migrations__", // Migration tracking table
    schema: "public", // Default schema
  },
  // PostgreSQL extensions (if using PostGIS, etc.)
  extensionsFilters: ["postgis"],
  // Strict mode - fail on potential issues
  strict: true,
  // Verbose output during migration generation
  verbose: process.env.NODE_ENV === "development",
  // Break on potential data loss (ask for confirmation)
  breakpoints: true,
});

// import "dotenv/config";
// import { resolve } from "node:path";
// import { config } from "dotenv";
// import { defineConfig } from "drizzle-kit";

// config({ path: resolve(__dirname, ".env.local") });

// if (!process.env.DATABASE_URL)
//   throw new Error("❌Not Found 'URL: process.env.DATABASE_URL'");

// export default defineConfig({
//   dialect: "postgresql",
//   schema: "../database/schema/index.ts",
//   out: "../database/migrations",
//   dbCredentials: { url: process.env.DATABASE_URL },
//   migrations: {
//     prefix: "timestamp",
//     table: "__drizzle_migrations__",
//     schema: "public",
//   },
//   extensionsFilters: ["postgis"],
//   strict: true,
//   verbose: true,
// });
