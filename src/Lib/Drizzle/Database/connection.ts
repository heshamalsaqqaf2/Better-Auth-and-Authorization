/**
 * @file server.ts
 * @description Database Server Initialization
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const databaseServer = drizzle({
  client: pool,
  logger: true,
});
