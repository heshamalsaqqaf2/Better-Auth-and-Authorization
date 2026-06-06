/**
 * @file src/Testing/Scripts/debug-env.ts
 * @description Debug environment variables loading
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

console.log("=== Environment Debug ===\n");

// 1. Check current working directory
console.log("📂 Current Working Directory:", process.cwd());

// 2. Check .env.local existence
const envPath = resolve(process.cwd(), ".env.local");
console.log("📄 .env.local path:", envPath);
console.log("✅ .env.local exists:", existsSync(envPath));

// 3. Load dotenv
const result = dotenv.config({ path: envPath });
console.log("\n📥 Dotenv load result:");
if (result.error) {
  console.log("❌ Error:", result.error.message);
} else {
  console.log("✅ Loaded successfully");
  console.log("📊 Keys loaded:", Object.keys(result.parsed || {}).join(", "));
}

// 4. Check specific variables
console.log("\n🔍 Specific Variables:");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ present" : "❌ missing",
);
console.log("NODE_ENV:", process.env.NODE_ENV || "(not set)");

// 5. List all DB-related env vars
const dbVars = Object.keys(process.env).filter(
  (k) =>
    k.toLowerCase().includes("db") ||
    k.toLowerCase().includes("database") ||
    k.toLowerCase().includes("postgres"),
);
console.log(
  "\n📋 All DB-related env vars:",
  dbVars.length > 0 ? dbVars.join(", ") : "none",
);
