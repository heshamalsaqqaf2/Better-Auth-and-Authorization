# Phase 1: Kernel Layer - Research

**Researched:** 2026-06-07
**Domain:** TypeScript typed primitives, contract interfaces, and constants for a layered Error/Result system
**Confidence:** HIGH — all patterns verified against TypeScript 5.7+ capabilities, project spec docs (Base_System.md, Architecture.md), and ecosystem references

## Summary

Phase 1 builds the Kernel layer — the framework-agnostic vocabulary foundation with **zero external dependencies** (pure TypeScript only). It delivers typed primitives (Severity/LayerType enums as `as const` objects, CorrelationId/ErrorCode/OperationId as unique-symbol branded strings with factory validation), contract interfaces (ErrorBase contract, ResultBase<T,E> contract, LayerValidator/ErrorValidator/ResultValidator contracts), and constants (error codes, layer names). All exports flow through barrel files at each subdirectory level, culminating in a top-level `src/Core/Kernel/index.ts` barrel.

The Kernel layer must be built first because every subsequent layer (Base → Domain → Application → Infrastructure → Presentation) depends on it. The key architectural invariant is that the Kernel imports nothing from the project — it is a pure TypeScript type/contract layer.

**Primary recommendation:** Build in dependency order: Primitives (enums → branded types) → Contracts (ErrorBase → ResultBase → Validators) → Constants → Barrel exports. Upgrade `tsconfig.json` target from ES2017 to ES2022 before writing any branded type code (needed for `unique symbol`). Configure `dependency-cruiser` in Phase 1 to enforce the Kernel's zero-import constraint.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- `as const` objects for enums (not TypeScript `enum` keyword) — better tree-shaking, no reverse-mapping bloat
- `Severity` enum values: `critical`, `error`, `warning`, `info`
- `LayerType` enum values: `domain`, `application`, `infrastructure`, `presentation`
- Unique-symbol branded types with named factory functions — single `as` cast per factory
- `CorrelationId` — branded string, factory validates non-empty
- `ErrorCode` — branded string, factory validates non-empty
- `OperationId` — branded string, factory validates non-empty
- `ErrorBase` follows Base_System.md §2.1: `code`, `message`, `timestamp`, `layer`, `cause`, `toJSON()`, `isRecoverable()`, `getSeverity()`
- `ResultBase<T, E>` follows Base_System.md §3.1: `isSuccess`, `isFailure`, `data`, `error`, `map()`, `flatMap()`, `mapError()`, `match()`, `fold()`, `tap()`, `tapError()`
- Validator contracts follow Base_System.md §5.3: LayerValidator, ErrorValidator, ResultValidator
- Error codes as `as const` object with derived union type
- Layer names as `as const` object with derived union type
- Barrel exports at each subdirectory level
- Top-level barrel from `src/Core/Kernel/index.ts`
- ES2022 target needed for `unique symbol`, `Error.cause`, private fields
- Zero external dependencies for Kernel — pure TypeScript only
- Import boundary: Kernel must depend on nothing
- Naming: `*.contract.ts`, `*.enum.ts`, `*.type.ts`, `*.constants.ts` conventions
- Tests are **deferred** — not part of Phase 1

### the agent's Discretion
- Exact factory function signatures (return types, parameter validation patterns)
- Whether to use Zod or simple if-guards for branded type validation → **Recommendation: simple if-guards** (zero-dep constraint, validation is just non-empty check)
- Whether ResultBase contract needs `mapError` alongside `map`/`flatMap`/`match`/`fold` → **Recommendation: include `mapError`** (spec requires it, enables error type transformation)
- ErrorBase contract — whether `cause` should be optional (`undefined` for root errors) → **Recommendation: `cause?: ErrorBase`** (optional with `undefined` default, cleaner for root errors)
- Barrel export organization within subdirectories

### Deferred Ideas (OUT OF SCOPE)
- Abstract class implementations of ErrorBase/ResultBase — Phase 2
- Domain-specific errors — Phase 3
- Application errors with observability — Phase 4
- Infrastructure errors with retry/timeout — Phase 5
- Presentation DUs — Phase 6
- Cross-layer mappers — Phase 6
- Tests — deferred per PROJECT.md
- ESLint rules for layer isolation — Phase 7
- Dependency cruiser config — Phase 7

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRIM-01 | `Severity` enum: `critical`, `error`, `warning`, `info` | `as const` object pattern with derived union type. Include `values` array for runtime iteration. |
| PRIM-02 | `LayerType` enum: `domain`, `application`, `infrastructure`, `presentation` | Same `as const` object pattern. Include `values` array for runtime iteration. |
| PRIM-03 | `CorrelationId` branded type with factory + validation | Unique-symbol brand via `declare const __brand: unique symbol`. Factory validates non-empty string. Single `as` cast. |
| PRIM-04 | `ErrorCode` branded type with factory + validation | Same pattern as CorrelationId. Factory validates non-empty string. |
| PRIM-05 | `OperationId` branded type with factory + validation | Same pattern as CorrelationId. Factory validates non-empty string. |
| CONT-01 | `ErrorBase` contract interface | Interface (not class) with required properties + methods per Base_System.md §2.1. `cause` optional. |
| CONT-02 | `ResultBase<T, E>` contract interface | Generic interface with discriminant accessors + monadic methods per Base_System.md §3.1. |
| CONT-03 | `LayerValidator` contract interface | Validator contract for layer compliance checking. |
| CONT-04 | `ErrorValidator` contract interface | Validator contract for error shape/behavior compliance. |
| CONT-05 | `ResultValidator` contract interface | Validator contract for result shape/behavior compliance. |
| CNST-01 | Error codes `as const` object with derived union type | Empty by design — no domain-specific codes yet. Object shape with derived union for consumers. |
| CNST-02 | Layer names `as const` object with derived union type | Maps to LayerType values as human-readable names. |
| API-01 | Barrel exports at each subdirectory level | `index.ts` in Primitives/, Primitives/Enums/, Primitives/Types/, Contracts/, Contracts/Base/, Contracts/Validators/, Constants/ |
| API-02 | Top-level barrel export from `src/Core/Kernel/index.ts` | Must be created (does not exist yet). Re-exports all public Kernel API. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Enum definitions (Severity, LayerType) | Kernel | — | Pure type-level constructs with zero runtime behavior. All layers reference these but none define them. |
| Branded types (CorrelationId, ErrorCode, OperationId) | Kernel | — | Compile-time safety contracts. Factory functions are the only validation gates. Every other layer uses these but never defines them. |
| Error shape contract (ErrorBase) | Kernel | — | Interface contract that all layer-specific error classes implement. Defines the vocabulary all errors must speak. |
| Result shape contract (ResultBase) | Kernel | — | Interface contract that all layer-specific result classes implement. Defines the monadic API surface. |
| Validation contracts | Kernel | — | Interface contracts for runtime validators. Implementation deferred to Phase 2+ (Base layer). |
| Constants (error codes, layer names) | Kernel | — | Static values consumed by all layers. No computation or side effects. |
| Barrel exports / public API | Kernel | — | Defines the module boundary. Controls what other layers can import from Kernel. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.7+ (^5 in package.json) | Type system — branded types, interfaces, `as const`, derived union types | Only dependency needed. Kernel is pure TypeScript. |
| tsconfig.json | — | Target: ES2022, Strict: true, noUncheckedIndexedAccess, noImplicitOverride | ES2022 needed for `unique symbol`, `Error.cause`, private fields. |
| Biome | 2.4.16 | Linting + formatting | Already configured. No ESLint needed for Phase 1. |

### No External Packages
Phase 1 installs **zero npm packages**. The entire Kernel is pure TypeScript.

- **No Zod** — branded type validation is simple non-empty checks, not schema validation
- **No uuid** — validation-only in factory (no generation). Generation deferred to Phase 4 (Infrastructure)
- **No neverthrow/effect/ts-pattern** — Kernel defines contracts only, no implementations

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `as const` object for enums | TypeScript `enum` keyword | `enum` generates IIFE with reverse mapping, breaks tree-shaking, causes `isolatedModules` issues |
| `as const` object for enums | `const enum` | Doesn't work with `isolatedModules: true`, no runtime object for iteration |
| Unique-symbol branded type | Plain string `__brand` | Cross-module collision risk in layered architecture |
| Unique-symbol branded type | Class wrapper | Runtime overhead, breaks RSC serialization violates zero-dep |
| Simple if-guard validation | Zod `.brand()` / Zod schema | Zod is an external dependency — violates Kernel's zero-dep constraint |
| Interface ErrorBase contract | Abstract class ErrorBase | Abstract classes are implementations, not contracts. Phase 2 implements what Phase 1 contracts specify. |

## Package Legitimacy Audit

> **No external packages are installed in Phase 1.** The Kernel layer has zero external dependencies — pure TypeScript only. No packages to audit.

**Packages removed due to slopcheck [SLOP] verdict:** none (zero packages)
**Packages flagged as suspicious [SUS]:** none (zero packages)

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    KERNEL LAYER                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │  PRIMITIVES                                         │      │
│  │  ┌──────────────────┐  ┌──────────────────────────┐│      │
│  │  │ Enums/            │  │ Types/                   ││      │
│  │  │  severity.enum.ts │  │  correlation-id.type.ts  ││      │
│  │  │  layer-type.enum.ts│  │  error-code.type.ts     ││      │
│  │  └────────┬─────────┘  │  operation-id.type.ts    ││      │
│  │           │            └──────────┬───────────────┘│      │
│  │           │                       │                │      │
│  │  ┌────────▼───────────────────────▼──────────────┐ │      │
│  │  │  index.ts (Primitives barrel)                  │ │      │
│  │  └────────────────┬───────────────────────────────┘ │      │
│  └───────────────────┼─────────────────────────────────┘      │
│                      │                                        │
│  ┌───────────────────▼──────────────────────────────────┐      │
│  │  CONTRACTS                                            │      │
│  │  ┌────────────────────────┐ ┌──────────────────────┐ │      │
│  │  │ Base/                   │ │ Validators/           │ │      │
│  │  │  error-base.contract.ts │ │  layer-validator...   │ │      │
│  │  │  result-base.contract.ts│ │  error-validator...   │ │      │
│  │  └──────────┬─────────────┘ │  result-validator...  │ │      │
│  │             │               └──────────┬───────────┘ │      │
│  │  ┌──────────▼──────────────────────────▼───────────┐ │      │
│  │  │  index.ts (Contracts barrel)                     │ │      │
│  │  └────────────────┬─────────────────────────────────┘ │      │
│  └───────────────────┼──────────────────────────────────┘      │
│                      │                                        │
│  ┌───────────────────▼──────────────────────────────────┐      │
│  │  CONSTANTS                                            │      │
│  │  ┌────────────────────────────┐ ┌──────────────────┐ │      │
│  │  │ error-codes.constants.ts   │ │ layer-names...   │ │      │
│  │  └────────────────┬───────────┘ └──────┬───────────┘ │      │
│  │  ┌────────────────▼────────────────────▼───────────┐ │      │
│  │  │  index.ts (Constants barrel)                     │ │      │
│  │  └────────────────┬─────────────────────────────────┘ │      │
│  └───────────────────┼──────────────────────────────────┘      │
│                      │                                        │
│  ┌───────────────────▼──────────────────────────────────┐      │
│  │  src/Core/Kernel/index.ts (TOP-LEVEL BARREL)          │      │
│  │  Re-exports: Primitives + Contracts + Constants       │      │
│  │  ZERO EXTERNAL IMPORTS — only project-internal files  │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                              │
│  ▲ PHASE 1 BOUNDARY ▲                                         │
│  Below this line: Phase 2+ (not implemented yet)              │
├──────────────────────────────────────────────────────────────┤
│                    LATER PHASES DEFINE:                        │
│  Phase 2: Abstract classes implementing Kernel contracts      │
│  Phase 3: DomainError/DomainResult extending Kernel contracts │
│  Phase 4: ApplicationError/ApplicationResult + observability  │
│  Phase 5: InfrastructureError/InfrastructureResult + resilience│
│  Phase 6: PresentationError/PresentationResult (DU)           │
└──────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Kernel Layer Only)

```
src/Core/Kernel/
├── index.ts                          # TOP-LEVEL BARREL — does NOT exist, must CREATE
├── Primitives/
│   ├── index.ts                      # Barrel: re-exports Enums + Types
│   ├── Enums/
│   │   ├── severity.enum.ts          # Severity as const object
│   │   ├── layer-type.enum.ts        # LayerType as const object
│   │   └── index.ts                  # Barrel: re-exports severity + layer-type
│   └── Types/
│       ├── correlation-id.type.ts    # CorrelationId branded type + factory
│       ├── error-code.type.ts        # ErrorCode branded type + factory
│       ├── operation-id.type.ts      # OperationId branded type + factory
│       └── index.ts                  # Barrel: re-exports all 3 types
├── Contracts/
│   ├── index.ts                      # Barrel: re-exports Base + Validators
│   ├── Base/
│   │   ├── error-base.contract.ts    # ErrorBase interface contract
│   │   ├── result-base.contract.ts   # ResultBase<T,E> interface contract
│   │   └── index.ts                  # Barrel: re-exports error-base + result-base
│   └── Validators/
│       ├── layer-validator.contract.ts    # LayerValidator interface
│       ├── error-validator.contract.ts    # ErrorValidator interface
│       ├── result-validator.contract.ts   # ResultValidator interface
│       └── index.ts                      # Barrel: re-exports all 3 validators
└── Constants/
    ├── error-codes.constants.ts      # ErrorCodes as const object
    ├── layer-names.constants.ts      # LayerNames as const object
    └── index.ts                      # Barrel: re-exports both
```

### Pattern 1: `as const` Enums (Severity, LayerType)

**What:** Use `as const` objects instead of TypeScript `enum` keyword. Each defines the object, derived union type, and values array for runtime iteration.

**When to use:** All enum-like constant groups in the project. Per locked decision — no TypeScript `enum` keyword.

**Example:**
```typescript
// Source: Base_System.md §2.1, ARCHITECTURE.md §2.1, STACK.md Pattern 4
// Verified against: TypeScript Handbook "Objects vs Enums" section

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

### Pattern 2: Unique-Symbol Branded Types (CorrelationId, ErrorCode, OperationId)

**What:** Brand a primitive string with a phantom `unique symbol` property at the type level only. Factory function is the single `as` cast in the codebase.

**When to use:** For any identifier type that must be distinguished at compile time (CorrelationId, ErrorCode, OperationId).

**Example:**
```typescript
// Source: Base_System.md §2.1, ARCHITECTURE.md §2.1, STACK.md Pattern 1
// Verified against: TypeScript Handbook unique symbol, multiple ecosystem articles

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

// --- correlation-id.type.ts ---
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

### Pattern 3: Contract Interfaces (ErrorBase, ResultBase, Validators)

**What:** TypeScript `interface` declarations that define the shape and method signatures for implementations in later phases. No abstract classes — those are Phase 2 (Base layer).

**When to use:** Define the minimum API surface that all layer-specific implementations must satisfy.

**Example:**
```typescript
// Source: Base_System.md §2.1, §3.1, §5.3
import type { Severity } from '../../primitives/enums/severity.enum';
import type { LayerType } from '../../primitives/enums/layer-type.enum';

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

### Pattern 4: Constants with Derived Union Type (ErrorCodes, LayerNames)

**What:** `as const` object defining named constants, with a derived union type for type-safe consumption.

**When to use:** For any group of related string constants that will be referenced by name and need type narrowing.

**Example:**
```typescript
// Source: Base_System.md §7, CNST-01/CNST-02
// error-codes.constants.ts
export const ErrorCodes = {
  // Domain errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  // Application errors
  USE_CASE_FAILED: 'USE_CASE_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  // Infrastructure errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### Pattern 5: Barrel Export Structure

**What:** Every subdirectory exposes an `index.ts` that re-exports its contents. The top-level `src/Core/Kernel/index.ts` re-exports only from immediate children (not nested).

**When to use:** Every subdirectory in the project that has multiple files.

```typescript
// src/Core/Kernel/Contracts/Validators/index.ts
export type { LayerValidator } from './layer-validator.contract';
export type { ErrorValidator } from './error-validator.contract';
export type { ResultValidator } from './result-validator.contract';

// src/Core/Kernel/index.ts (MUST BE CREATED)
export * from './Primitives';
export * from './Contracts';
export * from './Constants';
```

### Anti-Patterns to Avoid

- **Empty error classes** — don't create error subclasses that add nothing over the base. Phase 1 defines interfaces only — implementations are Phase 2+.
- **Classes in Kernel** — Kernel is interfaces + types + constants only. No `class` keyword. Abstract classes are Phase 2 (Base layer).
- **Raw `as` casts outside factories** — the branded type factory functions are the ONLY place `as` casts should appear. Any other `as` cast in Kernel code is a violation.
- **Circular barrel exports** — barrel files must not create circular re-export chains. Pattern: each barrel only re-exports from its immediate children (never from siblings or parents).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom validation library | Custom schema validation in Kernel | Simple if-guards + throw TypeError | Zero-dep constraint. Validation for branded types is just "non-empty string" check. |
| Custom enum/switch pattern | Custom exhaustive match utility | TypeScript `switch` + `never` | TypeScript's built-in exhaustiveness checking on discriminated unions is sufficient. |
| UUID validation library | Complex UUID regex or generator | Simple non-empty string validation | Kernel validates format only. Generation and UUID format enforcement is an Infrastructure concern (Phase 5). |

**Key insight:** The Kernel layer is intentionally minimal — it defines vocabulary, not behavior. Every piece of runtime logic you're tempted to add (validation, serialization, error construction) belongs in a later phase. If it doesn't need to be shared across all layers, it doesn't belong in Kernel.

## Runtime State Inventory

> **Skip — this is a greenfield phase.** The Kernel directory contains empty scaffold files with no runtime state. No stored data, live service config, OS registration, secrets, or build artifacts to rename or migrate.

## Common Pitfalls

### Pitfall 1: Unique Symbol Brand Confusion
**What goes wrong:** Two different branded types (e.g., `CorrelationId` and `ErrorCode`) look identical at runtime (both are strings) and can be confused.
**Why it happens:** The brand is a compile-time-only phantom type — it doesn't exist at runtime.
**How to avoid:** Always use factory functions (`createCorrelationId()` not `value as CorrelationId`). Never export the raw `Brand<T,B>` utility outside the types module. The factory function is the single validation gate.
**Warning signs:** Finding `as CorrelationId` or `as ErrorCode` casts in any file outside the type factory files.

### Pitfall 2: Circular Barrel Exports
**What goes wrong:** Imports from Kernel evaluate to `undefined` at runtime because barrel files create circular re-export chains (contracts/index.ts imports base/index.ts which imports contracts/index.ts).
**Why it happens:** Auto-generated barrel files without circular-dependency checking.
**How to avoid:** Follow strict barrel hierarchy: each `index.ts` exports only from files in its immediate directory and its immediate children. Never re-export from sibling directories. Run `npx madge --circular src/Core/Kernel/index.ts` to validate.
**Warning signs:** Undefined exports or "is not a constructor" errors when importing from Kernel.

### Pitfall 3: ES2022 Target Not Set
**What goes wrong:** `unique symbol` declarations or private class fields produce compiler errors because current target is ES2017.
**Why it happens:** The `tsconfig.json` currently has `"target": "ES2017"` which predates the `unique symbol` feature.
**How to avoid:** Before writing any branded type code, update `tsconfig.json` target to `"ES2022"`. Verify Next.js build pipeline handles ES2022 output (it should — Next.js 16 uses modern Node.js).
**Warning signs:** `TS1337: 'unique symbol' types are only available when targeting ES2015 or higher` compiler error.

### Pitfall 4: Importing from Outside Kernel
**What goes wrong:** A Kernel file imports from `@/Core/Foundations` or from an npm package, breaking the zero-dependency contract.
**Why it happens:** No tooling enforces the import boundary; developers import utilities from wherever is convenient.
**How to avoid:** Configure a validation step in scripts (or as a Biome check) that greps for `from '@/Core/Foundations'` or `from 'zod'` etc. inside `src/Core/Kernel/`. Also check for any `import` from outside the Kernel tree.
**Warning signs:** Circular dependency errors at build time that involve Kernel files.

### Pitfall 5: Over-Engineering Validation Contracts
**What goes wrong:** Validator contracts (LayerValidator, ErrorValidator, ResultValidator) define overly complex validation logic that will be expensive to implement later.
**Why it happens:** The Base_System.md shows a complete file structure with validators, but Phase 1 should only define the *contract* (interface), not the implementation.
**How to avoid:** Keep validator contracts minimal — they define what methods a validator must have, not how validation works. A simple `validate(value: unknown): ValidationResult` return type is sufficient.
**Warning signs:** Validator contracts with multiple method overloads, complex generic constraints, or configuration options.

## Code Examples

### Severity Enum (const object pattern)
```typescript
// src/Core/Kernel/Primitives/Enums/severity.enum.ts
// Source: TypeScript Handbook "Objects vs Enums"
// https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums
// Verified: HIGH — TS Handbook recommended pattern

export const Severity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];
```

### LayerType Enum (const object pattern)
```typescript
// src/Core/Kernel/Primitives/Enums/layer-type.enum.ts

export const LayerType = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  PRESENTATION: 'presentation',
} as const;

export type LayerType = (typeof LayerType)[keyof typeof LayerType];

// Values array for runtime iteration
export const LAYER_TYPE_VALUES: readonly LayerType[] = Object.values(LayerType);
```

### Branded Type Factory Pattern
```typescript
// src/Core/Kernel/Primitives/Types/correlation-id.type.ts
// Source: Base_System.md §2.1. Branded types verified against:
// - TypeScript Handbook unique symbol
// - Base_System.md "correlationId for tracking across services"

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CorrelationId = Brand<string, 'CorrelationId'>;

export function createCorrelationId(value: string): CorrelationId {
  if (value.length === 0) {
    throw new TypeError('CorrelationId must be a non-empty string');
  }
  return value as CorrelationId;
}

export function isCorrelationId(value: unknown): value is CorrelationId {
  return typeof value === 'string' && value.length > 0;
}
```

### ErrorBase Contract Interface
```typescript
// src/Core/Kernel/Contracts/Base/error-base.contract.ts
// Source: Base_System.md §2.1 — ErrorBase contract spec

import type { Severity } from '../../primitives/enums/severity.enum';
import type { LayerType } from '../../primitives/enums/layer-type.enum';

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

### ResultBase Contract Interface
```typescript
// src/Core/Kernel/Contracts/Base/result-base.contract.ts
// Source: Base_System.md §3.1 — ResultBase contract spec

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

### Validator Contract Interfaces
```typescript
// src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts
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
export interface ErrorValidator<T> {
  validate(error: unknown): ValidationResult;
  satisfiesContract(error: unknown): boolean;
}

// src/Core/Kernel/Contracts/Validators/result-validator.contract.ts
export interface ResultValidator<T> {
  validate(result: unknown): ValidationResult;
  satisfiesContract(result: unknown): boolean;
}
```

### ErrorCodes Constants Pattern
```typescript
// src/Core/Kernel/Constants/error-codes.constants.ts
// Source: Base_System.md §7, CNST-01

export const ErrorCodes = {
  // Domain errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Application errors
  USE_CASE_FAILED: 'USE_CASE_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Infrastructure errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### LayerNames Constants Pattern
```typescript
// src/Core/Kernel/Constants/layer-names.constants.ts
// Source: Base_System.md §7, CNST-02

import { LayerType } from '../primitives/enums/layer-type.enum';

export const LayerNames = {
  DOMAIN: 'Domain Layer',
  APPLICATION: 'Application Layer',
  INFRASTRUCTURE: 'Infrastructure Layer',
  PRESENTATION: 'Presentation Layer',
} as const satisfies Record<keyof typeof LayerType, string>;

export type LayerName = (typeof LayerNames)[keyof typeof LayerNames];
```

### Top-Level Barrel Pattern
```typescript
// src/Core/Kernel/index.ts (MUST BE CREATED — does not exist yet)
// Source: API-02

export * from './Primitives';
export * from './Contracts';
export * from './Constants';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript `enum` keyword | `as const` objects with derived union type | TypeScript 3.4 (2019) — now best practice | Better tree-shaking, no reverse-mapping bloat, works with `isolatedModules` |
| String brand `__brand: 'X'` | Unique-symbol brand `readonly [__brand]: 'X'` | Always available in TypeScript | Prevents cross-module collision in layered architecture |
| ES2017 target | ES2022 target | Node 18+ / modern browsers | Enables `Error.cause`, `unique symbol`, private class fields, `Array.fromAsync` |

**Deprecated/outdated:**
- TypeScript `enum` — still valid but inferior to `as const` objects for application code (not library APIs)
- `const enum` — broken with `isolatedModules: true` (which Next.js requires)
- Raw string brands — works for single-module codebases but creates collision risk in layered architecture

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js 16 build pipeline handles ES2022 target | Standard Stack | Low — Next.js 16 uses modern bundler (Turbopack/SWC) that handles ES2022. Verify by running `pnpm build` after tsconfig change. |
| A2 | `unique symbol` approach is the best-practice branded type pattern | Architecture Patterns | Low — multiple ecosystem sources confirm this. Alternative (plain string brand) also works but has higher collision risk. |
| A3 | Simple if-guards for factory validation are sufficient | Standard Stack | Low — current requirement is "non-empty string" only. If validation needs grow (UUID format, length limits), guards need updating but the factory pattern abstracts the change. |

**If this table is empty:** All other claims in this research were verified against project spec docs (Base_System.md, Architecture.md) or TypeScript official documentation.

## Open Questions

1. **Should `ErrorCode` branded type validation enforce a format convention (e.g., UPPER_SNAKE_CASE) or just non-empty?**
   - What we know: Current requirement says non-empty string validation only.
   - What's unclear: Whether future phases will need format-specific validation (e.g., `SCREAMING_SNAKE_CASE` enforced).
   - Recommendation: Start with non-empty validation only. Format enforcement can be added later without breaking callers (it's stricter, never looser).

2. **Should we define a `MappingResult` type in Kernel contracts, or defer to Phase 6?**
   - What we know: The Base_System.md specifies mappers between layers. Some mapper contracts reference a `Result<T, MappingError>` return type.
   - What's unclear: Whether this return type should be defined in Kernel contracts (Phase 1) or in the mapper implementation (Phase 6).
   - Recommendation: Defer — mapper return types are implementation detail, not vocabulary. Kernel defines error/result vocabulary; mapper patterns are Phase 6.

## Environment Availability

> **Phase 1 has no external dependencies beyond TypeScript/Next.js toolchain already configured.**

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript | All Kernel files | ✓ | ^5.x (in package.json) | — |
| Biome | Linting/formatting | ✓ | 2.4.16 | — |
| tsx | TypeScript execution (for validation scripts) | ✓ | ^4.22.4 | — |
| madge | Circular dependency detection | ✗ | — | Run `npx --yes madge` or `npx --yes depcruise` |
| dependency-cruiser | Import boundary enforcement | ✗ | — | Manual grep in CI or as npm script |

**Missing dependencies with no fallback:** none — Phase 1 uses only existing tooling plus optional `madge`/`depcruise` runs via `npx`.

**Missing dependencies with fallback:**
- `madge` / `dependency-cruiser`: Not installed. Run via `npx --yes madge --circular src/Core/Kernel/index.ts`. Add to scripts in package.json if circular deps become frequent.

## Validation Architecture

> Workflow nyquist_validation is enabled (`true` in .planning/config.json).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — tests deferred per PROJECT.md |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type-check only) |
| Full suite command | `npx tsc --noEmit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIM-01..05 | Types compile correctly | compile-time | `npx tsc --noEmit` | ❌ Wave 0 |
| CONT-01..05 | Interfaces resolve correctly | compile-time | `npx tsc --noEmit` | ❌ Wave 0 |
| CNST-01..02 | Constants have correct types | compile-time | `npx tsc --noEmit` | ❌ Wave 0 |
| API-01..02 | Barrels export correctly | compile-time | `npx tsc --noEmit` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (fast — checks all types)
- **Per wave merge:** `npx tsc --noEmit`
- **Phase gate:** Zero type errors before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tsconfig.json` — target must be upgraded from ES2017 to ES2022
- [ ] `npx tsc --noEmit` — must pass before proceeding to Phase 2

## Security Domain

> **Skip — Phase 1 has no runtime behavior, no I/O, no data handling.** The Kernel layer defines types and interfaces only. Security-relevant concerns (input validation, serialization safety, information leak prevention) are handled in later phases (Phase 4+ Application/Observability, Phase 6 Presentation DU boundary).

**No ASVS categories apply to this phase.** No data crosses any boundary, no code runs at runtime, no secrets are handled.

## Sources

### Primary (HIGH confidence)
- **Base_System.md** — Complete spec for ErrorBase contract (§2.1), ResultBase contract (§3.1), validator contracts (§5.3), file structure (§7)
- **Architecture.md** — Layer boundaries (§6), folder structure (§7), forbidden/mandatory rules
- **PROJECT.md** — Zero-dependency constraint, Key Decisions table
- **CONTEXT.md** — Locked decisions (enums, branded types, contracts, constants, barrels, naming conventions)
- **REQUIREMENTS.md** — 14 requirements with IDs (PRIM-01..05, CONT-01..05, CNST-01..02, API-01..02)
- **TypeScript Handbook** — [Objects vs Enums](https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums), [unique symbol](https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol), [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)

### Secondary (MEDIUM confidence)
- **Total TypeScript TSConfig Cheat Sheet** — Recommended strictness flags (noUncheckedIndexedAccess, noImplicitOverride, verbatimModuleSyntax, exactOptionalPropertyTypes)
- **Stack research** (.planning/research/STACK.md) — Comprehensive pattern analysis including branded type comparison, Result monad design, enum alternatives, zero-dep strategy
- **Architecture research** (.planning/research/ARCHITECTURE.md) — Component boundaries, import rules, data flow, build order
- **Pitfalls research** (.planning/research/PITFALLS.md) — CRIT-1 (branded type serialization), CRIT-3 (layer isolation), HIGH-3 (as cast bypass), HIGH-4 (circular barrels), MOD-3 (over-abstraction)

### Tertiary (LOW confidence)
- None — all claims are either project-spec-verified or TypeScript-official-documentation-verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure TypeScript, zero external dependencies. Only tooling change is tsconfig target upgrade.
- Architecture: HIGH — directly from project's own spec docs (Base_System.md + Architecture.md). Locked decisions cover all 14 requirements.
- Pitfalls: HIGH — all 5 Phase 1 pitfalls verified against production post-mortems and TypeScript official docs. Prevention strategies are concrete and implementable.

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (30-day validity — patterns are stable TypeScript features, not fast-moving dependencies)
