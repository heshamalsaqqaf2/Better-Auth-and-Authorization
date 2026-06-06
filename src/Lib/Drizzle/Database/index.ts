/**
 * @file src/lib/drizzle/database/index.ts
 * @description 📤 Database Layer Public API
 */

// Export database client and utilities
export * from "../Config";

// Export connection pool config
export {
  type ConnectionPoolConfig,
  getConnectionPoolConfig,
  validateDatabaseUrl,
} from "./connection.pool";

// Export schema
export { type DatabaseSchema, databaseSchema } from "./Schema";
