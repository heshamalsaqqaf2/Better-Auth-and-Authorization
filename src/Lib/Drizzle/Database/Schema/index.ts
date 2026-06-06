/**
 * @file src/lib/drizzle/database/schema/index.ts
 * @description Schema Aggregator - Collects all module schemas
 */

// Module Schema Imports
export * from "@/Modules/Authentication/Infrastructure/Database/Schema";

// Unified Schema Object for Drizzle ORM
import * as authentication from "@/Modules/Authentication/Infrastructure/Database/Schema";

/**
 * @description:
 * Combined schema object containing all tables, relations, and enums
 * This is passed to drizzle() for type-safe relational queries
 */
export const databaseSchema = {
  ...authentication,
};

export type DatabaseSchema = typeof databaseSchema;
