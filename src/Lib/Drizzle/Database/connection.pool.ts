/**
 * @file src/lib/drizzle/database/connection.pool.ts
 * @description Connection Pool Configuration for PostgreSQL
 */

export interface ConnectionPoolConfig {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statement_timeout?: number;
}

/**
 * @description
 * Connection Pool settings based on environment
 * Production: Higher limits for concurrent requests
 * Development: Lower limits to save resources
 * Includes timeouts to prevent hanging connections and long-running queries
 * @returns ConnectionPoolConfig object with appropriate settings
 */
export const getConnectionPoolConfig = (): ConnectionPoolConfig => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    // Maximum number of clients in the pool
    max: isProduction ? 20 : 10,
    // Minimum number of clients to keep in pool
    min: isProduction ? 5 : 2,
    // How long a client can sit idle before being closed (30 seconds)
    idleTimeoutMillis: 30000,
    // How long to wait for a client before throwing error (10 seconds)
    connectionTimeoutMillis: 10000,
    // Statement timeout for long-running queries (60 seconds)
    statement_timeout: 60000,
  };
};

/**
 * @description Validate DATABASE_URL format
 * @returns Validated DATABASE_URL string
 * @throws Error if DATABASE_URL is missing or invalid
 */
export const validateDatabaseUrl = (url: string | undefined): string => {
  if (!url) {
    throw new Error(
      "❌ DATABASE_URL is not defined. Please check your .env.local file",
    );
  }
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "❌ Invalid DATABASE_URL format. Must start with postgresql:// or postgres://",
    );
  }
  return url;
};
