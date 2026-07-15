/**
 * @file src/lib/drizzle/config/drizzle.config.ts
 * @description Drizzle Kit CLI Configuration
 */

import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// Load .env.local explicitly
const { config } = require("dotenv");
config({ path: resolve(__dirname, "../../../../.env.local") });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/Lib/Drizzle/Database/Schema/index.ts",
  out: "./src/Lib/Drizzle/Database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  extensionsFilters: ["postgis"],
  strict: true,
  verbose: process.env.NODE_ENV === "development",
  breakpoints: true,
});

// /**
//  * @file src/lib/drizzle/config/drizzle.config.ts
//  * @description Drizzle Kit CLI Configuration
//  */

// import "dotenv/config";
// import { resolve } from "node:path";
// import { defineConfig } from "drizzle-kit";

// // Load environment variables
// const envPath = resolve(process.cwd(), ".env.local");
// require("dotenv").config({ path: envPath });

// // Validate DATABASE_URL
// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "❌ DATABASE_URL is not defined in .env.local\n" +
//       "Please add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname",
//   );
// }

// export default defineConfig({
//   // Database dialect
//   dialect: "postgresql",
//   // Path to schema files (absolute path using resolve)
//   schema: "./src/Lib/Drizzle/Database/Schema/index.ts",
//   // Output directory for migrations (absolute path)
//   out: "./src/Lib/Drizzle/Database/migrations",
//   // Database credentials
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
//   // Migration settings
//   migrations: {
//     prefix: "timestamp", // Use timestamp prefix: 20260606123456_migration_name.sql
//     table: "__drizzle_migrations__", // Migration tracking table
//     schema: "public", // Default schema
//   },
//   // PostgreSQL extensions (if using PostGIS, etc.)
//   extensionsFilters: ["postgis"],
//   // Strict mode - fail on potential issues
//   strict: true,
//   // Verbose output during migration generation
//   verbose: process.env.NODE_ENV === "development",
//   // Break on potential data loss (ask for confirmation)
//   breakpoints: true,
// });
