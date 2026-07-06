/**
 * @file src/lib/drizzle/database/drizzle.client.ts
 * @description Drizzle ORM Client - Singleton Pattern with Connection Pool
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getConnectionPoolConfig, validateDatabaseUrl } from "../Database/connection.pool";
import * as schema from "../Database/Schema";

// 🔒 Singleton instance
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let poolInstance: Pool | null = null;

/**
 * Get or create Drizzle database client instance
 * Uses Singleton pattern to ensure only one connection pool exists
 */
export const getDatabaseClient = (): NodePgDatabase<typeof schema> => {
  if (dbInstance) return dbInstance;
  const databaseUrl = validateDatabaseUrl(process.env.DATABASE_URL);
  const poolConfig = getConnectionPoolConfig();

  // Create connection pool
  poolInstance = new Pool({
    connectionString: databaseUrl,
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    statement_timeout: poolConfig.statement_timeout,
  });
  // Handle pool errors
  poolInstance.on("error", (err) => {
    console.error("❌ Unexpected database pool error:", err);
    // Optionally: send alert, restart process, etc.
  });
  // Create Drizzle client with schema
  dbInstance = drizzle(poolInstance, {
    schema,
    logger: process.env.NODE_ENV === "development", // Log queries only in dev
  });
  return dbInstance;
};

/**
 * Get connection pool instance (for advanced operations)
 */
export const getConnectionPool = (): Pool => {
  if (!poolInstance) {
    getDatabaseClient();
  }
  if (!poolInstance) {
    throw new Error("Database pool failed to initialize — getDatabaseClient() did not set poolInstance");
  }
  return poolInstance;
};

/**
 * Health check - verify database connection
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const pool = getConnectionPool();
    const client = await pool.connect();

    try {
      await client.query("SELECT NOW()");
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    return false;
  }
};

/**
 * Graceful shutdown - close all connections
 * Call this in your app shutdown handler
 */
export const closeDatabaseConnections = async (): Promise<void> => {
  if (poolInstance) {
    console.log("🔌 Closing database connections...");
    await poolInstance.end();
    poolInstance = null;
    dbInstance = null;
    console.log("✅ Database connections closed");
  }
};

// 🚀 Export the default client instance (lazy initialization)
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    const client = getDatabaseClient();
    return Reflect.get(client, prop, client);
  },
});
