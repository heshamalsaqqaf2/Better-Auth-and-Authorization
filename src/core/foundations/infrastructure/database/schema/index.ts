/**
 * @file index.ts
 * @description Database Schema
 */

export * from "./authentication";
export * from "./authorization";

import * as authentication from "./authentication";
import * as authorization from "./authorization";

export const DatabaseSchema = {
  ...authentication,
  ...authorization,
};

export type DatabaseSchemaType = typeof DatabaseSchema;
