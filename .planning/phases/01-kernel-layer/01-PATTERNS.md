# Phase 1: Kernel Layer - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 20 (all empty scaffolds to be filled)
**Analogs found:** 5 with codebase patterns / 20 total

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/Core/Kernel/index.ts` | barrel | static | `src/Lib/Drizzle/index.ts` | role-match |
| `src/Core/Kernel/Primitives/index.ts` | barrel | static | `src/Lib/Drizzle/Database/index.ts` | role-match |
| `src/Core/Kernel/Primitives/Enums/severity.enum.ts` | enum | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` | enum | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Primitives/Enums/index.ts` | barrel | static | `src/Modules/Auth/Infrastructure/Database/Schema/index.ts` | role-match |
| `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` | type | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Primitives/Types/error-code.type.ts` | type | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Primitives/Types/operation-id.type.ts` | type | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Primitives/Types/index.ts` | barrel | static | `src/Lib/Drizzle/Database/index.ts` (lines 10-14) | role-match |
| `src/Core/Kernel/Contracts/Base/error-base.contract.ts` | contract | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Contracts/Base/result-base.contract.ts` | contract | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Contracts/Base/index.ts` | barrel | static | `src/Lib/Drizzle/Database/index.ts` (lines 10-14) | role-match |
| `src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts` | contract | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` | contract | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Contracts/Validators/result-validator.contract.ts` | contract | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Contracts/Validators/index.ts` | barrel | static | `src/Lib/Drizzle/Database/index.ts` (lines 10-14) | role-match |
| `src/Core/Kernel/Contracts/index.ts` | barrel | static | `src/Lib/Drizzle/index.ts` | role-match |
| `src/Core/Kernel/Constants/error-codes.constants.ts` | constants | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Constants/layer-names.constants.ts` | constants | static | — (RESEARCH.md patterns only) | no-analog |
| `src/Core/Kernel/Constants/index.ts` | barrel | static | `src/Lib/Drizzle/Database/index.ts` (lines 10-14) | role-match |
| `tsconfig.json` (MODIFY) | config | — | `tsconfig.json` (lines 1-34) | exact |

## Pattern Assignments

### Barrel Export Pattern - Intermediate Barrels

**Analog:** `src/Lib/Drizzle/Database/index.ts` (lines 10-14)

**Applied to:** All `index.ts` barrel files at intermediate directory levels (not top-level):
- `src/Core/Kernel/Primitives/Enums/index.ts`
- `src/Core/Kernel/Primitives/Types/index.ts`
- `src/Core/Kernel/Primitives/index.ts`
- `src/Core/Kernel/Contracts/Base/index.ts`
- `src/Core/Kernel/Contracts/Validators/index.ts`
- `src/Core/Kernel/Contracts/index.ts`
- `src/Core/Kernel/Constants/index.ts`

**Imports pattern** (`src/Lib/Drizzle/Database/index.ts` lines 1-17):
```typescript
/**
 * @file src/.../index.ts
 * @description 📤 [Directory] Public API
 */

// Export [category description]
export * from "../Config";

// Export [specific items with type annotation]
export {
  type ConnectionPoolConfig,
  getConnectionPoolConfig,
  validateDatabaseUrl,
} from "./connection.pool";

// Export schema
export { type DatabaseSchema, databaseSchema } from "./Schema";
```

**Kernel adaptation — concrete pattern to use:**
```typescript
// src/Core/Kernel/Primitives/Enums/index.ts
export { Severity, type Severity, SEVERITY_VALUES } from './severity.enum';
export { LayerType, type LayerType, LAYER_TYPE_VALUES } from './layer-type.enum';

// src/Core/Kernel/Primitives/Types/index.ts
export type { CorrelationId } from './correlation-id.type';
export { createCorrelationId, isCorrelationId } from './correlation-id.type';
export type { ErrorCode as BrandedErrorCode } from './error-code.type';
export { createErrorCode, isErrorCode } from './error-code.type';
export type { OperationId } from './operation-id.type';
export { createOperationId, isOperationId } from './operation-id.type';

// src/Core/Kernel/Primitives/index.ts
export * from './Enums';
export * from './Types';

// src/Core/Kernel/Contracts/Base/index.ts
export type { ErrorBase } from './error-base.contract';
export type { ResultBase } from './result-base.contract';

// src/Core/Kernel/Contracts/Validators/index.ts
export type { LayerValidator, ValidationResult } from './layer-validator.contract';
export type { ErrorValidator } from './error-validator.contract';
export type { ResultValidator } from './result-validator.contract';

// src/Core/Kernel/Contracts/index.ts
export * from './Base';
export * from './Validators';

// src/Core/Kernel/Constants/index.ts
export { ErrorCodes, type ErrorCode } from './error-codes.constants';
export { LayerNames, type LayerName } from './layer-names.constants';
```

### Barrel Export Pattern - Top-Level

**Analog:** `src/Lib/Drizzle/index.ts` (lines 1-6)

**Imports pattern:**
```typescript
/**
 * @file src/lib/drizzle/index.ts
 * @description 🎯 Drizzle Library Entry Point
 */

export * from "./Database";
```

**Kernel adaptation — concrete pattern to use:**
```typescript
// src/Core/Kernel/index.ts (MUST BE CREATED — does not exist)
// @file src/Core/Kernel/index.ts
// @description 🎯 Kernel Layer Public API — framework-agnostic typed vocabulary

export * from './Primitives';
export * from './Contracts';
export * from './Constants';
```

**Key constraints:**
- Kernel imports NOTHING from outside `src/Core/Kernel/`
- Zero external dependencies (pure TypeScript only)
- Uses `@/` path alias for imports within the project
- Barrel files never create circular re-export chains

### tsconfig.json Modification

**Analog:** `tsconfig.json` current state (lines 1-34)

**Current target** (line 3):
```json
"target": "ES2017"
```

**Required change** — upgrade to ES2022 to support `unique symbol`, `Error.cause`, private fields:
```json
"target": "ES2022"
```

**Additional strictness options to add** (per RESEARCH.md recommendation):
```json
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"verbatimModuleSyntax": true,
"exactOptionalPropertyTypes": true
```

### Enum Pattern (`as const` objects)

**Applied to:**
- `src/Core/Kernel/Primitives/Enums/severity.enum.ts`
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts`

**No codebase analog exists.** Pattern sourced from RESEARCH.md (lines 216-239) and TypeScript Handbook "Objects vs Enums".

**Severity enum:**
```typescript
// src/Core/Kernel/Primitives/Enums/severity.enum.ts
// Requirements: PRIM-01
// Pattern: as const object with derived union type + values array

export const Severity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];
// Evaluates to: 'critical' | 'error' | 'warning' | 'info'

// Values array for runtime iteration
export const SEVERITY_VALUES: readonly Severity[] = Object.values(Severity);
```

**LayerType enum:**
```typescript
// src/Core/Kernel/Primitives/Enums/layer-type.enum.ts
// Requirements: PRIM-02
// Pattern: as const object with derived union type + values array

export const LayerType = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  PRESENTATION: 'presentation',
} as const;

export type LayerType = (typeof LayerType)[keyof typeof LayerType];
// Evaluates to: 'domain' | 'application' | 'infrastructure' | 'presentation'

// Values array for runtime iteration
export const LAYER_TYPE_VALUES: readonly LayerType[] = Object.values(LayerType);
```

### Branded Type Pattern (unique-symbol)

**Applied to:**
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts`
- `src/Core/Kernel/Primitives/Types/error-code.type.ts`
- `src/Core/Kernel/Primitives/Types/operation-id.type.ts`

**No codebase analog exists** (no `unique symbol` usage in existing code). Pattern sourced from RESEARCH.md (lines 247-269) and TypeScript Handbook.

**Core branded type factory pattern:**
```typescript
// src/Core/Kernel/Primitives/Types/correlation-id.type.ts
// Requirements: PRIM-03

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CorrelationId = Brand<string, 'CorrelationId'>;

export function createCorrelationId(value: string): CorrelationId {
  if (value.length === 0) {
    throw new TypeError('CorrelationId must be a non-empty string');
  }
  return value as CorrelationId; // SINGLE as CAST — intentional, documented
}

export function isCorrelationId(value: unknown): value is CorrelationId {
  return typeof value === 'string' && value.length > 0;
}
```

**Same pattern for ErrorCode (`createErrorCode`, `isErrorCode`)** with `Brand<string, 'ErrorCode'>` and **OperationId (`createOperationId`, `isOperationId`)** with `Brand<string, 'OperationId'>`.

### Contract Interface Pattern

**Applied to:**
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts`
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts`
- `src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts`
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts`
- `src/Core/Kernel/Contracts/Validators/result-validator.contract.ts`

**No codebase analog exists.** Pattern sourced from RESEARCH.md (lines 271-309, 471-540) and Base_System.md.

**ErrorBase (CONT-01):**
```typescript
// src/Core/Kernel/Contracts/Base/error-base.contract.ts
// Requirements: CONT-01
// Source: Base_System.md §2.1

import type { Severity } from '../../Primitives/Enums/severity.enum';
import type { LayerType } from '../../Primitives/Enums/layer-type.enum';

export interface ErrorBase {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly layer: LayerType;
  readonly cause?: ErrorBase;

  isRecoverable(): boolean;
  getSeverity(): Severity;
  toJSON(): Record<string, unknown>;
}
```

**ResultBase (CONT-02):**
```typescript
// src/Core/Kernel/Contracts/Base/result-base.contract.ts
// Requirements: CONT-02
// Source: Base_System.md §3.1

import type { ErrorBase } from './error-base.contract';

export interface ResultBase<T, E extends ErrorBase> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly data?: T;
  readonly error?: E;

  map<U>(fn: (data: T) => U): ResultBase<U, E>;
  flatMap<U>(fn: (data: T) => ResultBase<U, E>): ResultBase<U, E>;
  mapError<F extends ErrorBase>(fn: (error: E) => F): ResultBase<T, F>;
  match<R>(handlers: { onSuccess: (data: T) => R; onFailure: (error: E) => R }): R;
  fold<R>(onSuccess: (data: T) => R, onFailure: (error: E) => R): R;
  tap(fn: (data: T) => void): ResultBase<T, E>;
  tapError(fn: (error: E) => void): ResultBase<T, E>;
}
```

**Validator contracts (CONT-03, CONT-04, CONT-05):**
```typescript
// src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts
// Requirements: CONT-03
// Source: Base_System.md §5.3

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface LayerValidator<T> {
  validate(value: unknown): ValidationResult;
  belongsToLayer(value: unknown): boolean;
}

// src/Core/Kernel/Contracts/Validators/error-validator.contract.ts
// Requirements: CONT-04
export interface ErrorValidator<T> {
  validate(error: unknown): ValidationResult;
  satisfiesContract(error: unknown): boolean;
}

// src/Core/Kernel/Contracts/Validators/result-validator.contract.ts
// Requirements: CONT-05
export interface ResultValidator<T> {
  validate(result: unknown): ValidationResult;
  satisfiesContract(result: unknown): boolean;
}
```

### Constants Pattern (`as const` with derived union)

**Applied to:**
- `src/Core/Kernel/Constants/error-codes.constants.ts`
- `src/Core/Kernel/Constants/layer-names.constants.ts`

**ErrorCodes (CNST-01):**
```typescript
// src/Core/Kernel/Constants/error-codes.constants.ts
// Requirements: CNST-01
// Pattern: as const object with derived union type
// Empty by design — no domain-specific codes yet

export const ErrorCodes = {
  // Reserved for future domain errors — Phase 3
  // Reserved for future application errors — Phase 4
  // Reserved for future infrastructure errors — Phase 5
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
// Evaluates to: never (empty object, expanded in later phases)
```

**LayerNames (CNST-02):**
```typescript
// src/Core/Kernel/Constants/layer-names.constants.ts
// Requirements: CNST-02
// Maps LayerType values to human-readable names

import { LayerType } from '../Primitives/Enums/layer-type.enum';

export const LayerNames = {
  DOMAIN: 'Domain Layer',
  APPLICATION: 'Application Layer',
  INFRASTRUCTURE: 'Infrastructure Layer',
  PRESENTATION: 'Presentation Layer',
} as const satisfies Record<keyof typeof LayerType, string>;

export type LayerName = (typeof LayerNames)[keyof typeof LayerNames];
// Evaluates to: 'Domain Layer' | 'Application Layer' | 'Infrastructure Layer' | 'Presentation Layer'
```

---

## Shared Patterns

### Import Convention

**Source:** `src/Lib/Drizzle/Database/index.ts` `src/app/layout.tsx` (line 3)

```typescript
// Use @/ path alias for all project-internal imports
import { db } from "@/Lib/Drizzle";
import { cn } from "@/Shared/utils/utils";

// Use relative imports for intra-package imports within Kernel
import type { Severity } from '../../Primitives/Enums/severity.enum';
```

**Kernel rule:** All intra-Kernel imports use RELATIVE paths. Kernel never imports from outside `src/Core/Kernel/`.

### File Naming Convention

**Source:** Existing scaffold file structure and Base_System.md §7

| Suffix | Purpose | Examples |
|--------|---------|---------|
| `.enum.ts` | `as const` object enums | `severity.enum.ts`, `layer-type.enum.ts` |
| `.type.ts` | Branded types + factories | `correlation-id.type.ts`, `error-code.type.ts` |
| `.contract.ts` | Interface contracts | `error-base.contract.ts`, `result-base.contract.ts` |
| `.constants.ts` | `as const` constant objects | `error-codes.constants.ts`, `layer-names.constants.ts` |
| `index.ts` | Barrel exports | Every subdirectory |

### tsconfig Path Alias

**Source:** `tsconfig.json` (line 22-23)

```json
"paths": {
  "@/*": ["./src/*"]
}
```

All Kernel files imported from outside Kernel use `@/Core/Kernel/...` path. Intra-Kernel files use relative imports.

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns + code examples instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `severity.enum.ts` | enum | static | No `as const` enum patterns in existing codebase |
| `layer-type.enum.ts` | enum | static | No `as const` enum patterns in existing codebase |
| `correlation-id.type.ts` | type | static | No `unique symbol` branded types in existing codebase |
| `error-code.type.ts` | type | static | No `unique symbol` branded types in existing codebase |
| `operation-id.type.ts` | type | static | No `unique symbol` branded types in existing codebase |
| `error-base.contract.ts` | contract | static | No implemented contract interfaces in existing codebase |
| `result-base.contract.ts` | contract | static | No implemented contract interfaces in existing codebase |
| `layer-validator.contract.ts` | contract | static | No implemented contract interfaces in existing codebase |
| `error-validator.contract.ts` | contract | static | No implemented contract interfaces in existing codebase |
| `result-validator.contract.ts` | contract | static | No implemented contract interfaces in existing codebase |
| `error-codes.constants.ts` | constants | static | No constants pattern files in existing codebase |
| `layer-names.constants.ts` | constants | static | No constants pattern files in existing codebase |

**These 12 files have no codebase analogs because the Kernel layer is the foundational vocabulary layer — its patterns (branded types, as const enums, contract interfaces, constants) are inherently new to the project.** The patterns are fully specified in RESEARCH.md (lines 216-592) and will serve as the pattern source.

---

## Metadata

**Analog search scope:**
- `src/Core/Kernel/` — all scaffold files (all empty)
- `src/Core/Foundations/` — all scaffold files (all empty)
- `src/Lib/Drizzle/` — barrel exports, connection pool, client config
- `src/Modules/Authentication/` — schema definitions, relations, barrel exports
- `src/Shared/` — utility functions, hooks
- `src/app/` — Next.js layout patterns
- `src/CompositionRoot/` — container (empty)

**Files scanned:** 18 non-empty files + ~60 empty scaffold files
**Pattern extraction date:** 2026-06-07
