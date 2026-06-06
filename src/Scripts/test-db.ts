/**
 * @file src/Testing/Scripts/test-db.ts
 * @description Test database connection
 */

import { checkDatabaseHealth } from "@/Lib/Drizzle";

async function testConnection() {
  console.log("🔍 Testing database connection...\n");

  const isHealthy = await checkDatabaseHealth();

  if (isHealthy) {
    console.log("✅ Database connection successful!\n");
    process.exit(0);
  } else {
    console.error("❌ Database connection failed!\n");
    process.exit(1);
  }
}

testConnection();
