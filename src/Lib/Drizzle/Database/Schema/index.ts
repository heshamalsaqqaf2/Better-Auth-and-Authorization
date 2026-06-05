/**
 * @file index.ts
 * @description 🎯 Aggregator - يجمع كل Schemas من كل الموديولات
 */

//Module Schemas
export * from "@/Modules/Authentication/Infrastructure/Database/Schema";

// Type Exports ORM
import * as authentication from "@/Modules/Authentication/Infrastructure/Database/Schema";

export const databaseSchema = {
  ...authentication,
};
