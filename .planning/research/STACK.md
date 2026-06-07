# Technology Stack: Layered Error & Result System

**Project:** authentication-better-auth — Kernel Layer (Phase 1)
**Researched:** 2026-06-07
**Overall confidence:** HIGH (verified against official docs, ecosystem patterns, and project specs)

---

## Recommended Stack

### Core Language & Compiler

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | ~5.7+ | Type system, branded types, DU exhaustiveness | Strict mode, `unique symbol`, template literal types, `satisfies` operator, `const` type parameters |
| Zero external dependencies | — | Kernel layer purity | Per PROJECT.md constraint: Kernel must depend on nothing |

### Compiler Configuration (tsconfig.json Upgrades Required)

**Current state:** `"strict": true` with `"target": "ES2017"` — insufficient for branded types and the patterns below.

**Target should be `ES2022`** because:
- `unique symbol` declarations (core to branded types) require ES2015+
- `Object.hasOwn()` (for type guards) requires ES2022
- Private class fields `#field` require ES2022
- `Error.cause` (for error wrapping chains per Base_System.md §4.1) requires ES2022
- No polyfilling needed in Node 18+ / modern browsers

**Recommended additions beyond `"strict": true`:**

| Option | Why It Matters | Confidence |
|--------|----------------|------------|
| `"noUncheckedIndexedAccess": true` | Prevents unsafe access on branded type maps and result collections — catches `undefined` at compile time | HIGH |
| `"noImplicitOverride": true` | Enforces `override` keyword on subclass methods — critical for ResultBase → DomainResult/ApplicationResult hierarchy | HIGH |
| `"verbatimModuleSyntax": true` | Enforces `import type` for type-only imports — keeps Kernel's zero-dependency guarantee verifiable at compile time | MEDIUM |
| `"exactOptionalPropertyTypes": true` | Prevents `undefined` from being assigned where optional is intended — matters for Presentation DU metadata fields | MEDIUM |
| `"target": "ES2022"` | Unlocks `Error.cause`, `unique symbol`, class fields | HIGH |

**NOT adding:**
- `noUnusedLocals` / `noUnusedParameters` — noisy during phased development, Biome handles unused code better
- `noFallthroughCasesInSwitch` — Biome covers this, and the `switch` + `assertNever` pattern in DU handling already catches exhaustiveness failures

---

### Pattern 1: Branded Types (CorrelationId, ErrorCode, OperationId)

**RECOMMENDED: String-tag brand with `unique symbol` key (hybrid approach)**

```typescript
// src/core/kernel/primitives/types/branded.type.ts
declare const __brand: unique symbol;

type Brand<T, K extends string> = T & { readonly [__brand]: K };
```

**Per-type declarations:**

```typescript
// src/core/kernel/primitives/types/correlation-id.type.ts
import type { Brand } from './branded.type';

type CorrelationId = Brand<string, 'CorrelationId'>;

function CorrelationId(value: string): CorrelationId {
  // Validation: must be a valid UUID v4 (or other format per spec)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new TypeError(`Invalid CorrelationId: ${value}`);
  }
  return value as CorrelationId;
}
```

```typescript
// src/core/kernel/primitives/types/error-code.type.ts
type ErrorCode = Brand<string, 'ErrorCode'>;
function ErrorCode(value: string): ErrorCode {
  if (value.length === 0 || value.length > 128) {
    throw new TypeError(`Invalid ErrorCode: ${value}`);
  }
  return value as ErrorCode;
}
```

```typescript
// src/core/kernel/primitives/types/operation-id.type.ts
type OperationId = Brand<string, 'OperationId'>;
function OperationId(value: string): OperationId {
  // Same UUID pattern or a ULID/nanoid pattern depending on spec
  return value as OperationId;
}
```

**Why this pattern (not alternatives):**

| Approach | Verdict | Reason |
|----------|---------|--------|
| `unique symbol` as tag + property key (recommended) | **USE** | `unique symbol` key prevents collision between modules; string tag enables `BrandOf<T>`, mapped types, and discriminated union over brands (see reasoning below). This is the **hybrid pattern** — best of both worlds. |
| Plain string `__brand: 'X'` only | **REJECT** | Two modules declaring `Brand<'UserId'>` produce the same type; cross-module collision risk in a multi-layer architecture. |
| `unique symbol` as tag only (no string) | **REJECT** | Cannot write `BrandOf<T>` utilities, cannot switch on tag values, opaque to mapped types. Per the 2026 ecosystem analysis, "the `unique symbol` version cannot do any of this" — serializer, validator registry, fixture builder cannot read the brand. |
| Class wrappers `class UserId { constructor(public value: string) {} }` | **REJECT** | Runtime overhead, breaks serialization (classes lose methods across RSC boundary), violates zero-dependency principle for something the type system provides for free. |
| Zod `.brand()` / Effect `Brand.Brand` | **REJECT** | External dependency. Kernel layer must be zero-dependency. If Zod is added later at Infrastructure layer, `.brand()` can be used at edges, but Kernel types remain pure. |
| `type UserId = string & { __brand: 'UserId' }` (no unique symbol key) | **REJECT for Kernel, OK for Foundation** | Module collision risk across the 4 layers makes the `unique symbol` key worthwhile at the Kernel contract level. |

**The key trade-off accepted:** The `unique symbol` key prevents `BrandOf<T>` utilities from extracting the tag as a runtime string. This is acceptable because:
1. Kernel's branded types are **compile-time contracts**, not discriminated union switches
2. The `Brand` type is exported and can be interrogated via conditional types at the type level
3. The constructor function is the single validation gate — consistent with "parse, don't validate" at boundaries

**Constructor pattern (smart constructors):**
- Each branded type has a **named function** (same name as the type) that validates and casts
- This is the **only** place `as Brand<...>` is used in the entire codebase
- Every string that enters the typed domain goes through one of these
- Validation logic lives in exactly one place per brand

**Confidence:** HIGH — verified against TypeScript 5.7 capabilities, multiple ecosystem articles (DEV, totaltypescript, TypeScript Handbook), and the unique symbol string-tag hybrid is the consensus best practice as of 2026.

---

### Pattern 2: Abstract Class for ResultBase<T, E> Monad

**RECOMMENDED: Abstract class with concrete Success/Failure subclasses**

```typescript
// src/core/kernel/contracts/base/result-base.contract.ts
/**
 * @template T — The success value type
 * @template E — The error type (extends ErrorBase contract)
 */
export abstract class ResultBase<T, E extends { readonly _tag: string }> {
  // -- Discriminant --
  abstract readonly _tag: 'Success' | 'Failure';

  // -- Accessors --
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;

  // -- Transformations (Functor) --
  abstract map<U>(fn: (data: T) => U): ResultBase<U, E>;
  abstract mapError<F extends { readonly _tag: string }>(
    fn: (error: E) => F
  ): ResultBase<T, F>;

  // -- Chain (Monad) --
  abstract flatMap<U>(
    fn: (data: T) => ResultBase<U, E>
  ): ResultBase<U, E>;

  // -- Pattern Matching --
  abstract match<R>(handlers: {
    onSuccess: (data: T) => R;
    onFailure: (error: E) => R;
  }): R;
  abstract fold<R>(
    onSuccess: (data: T) => R,
    onFailure: (error: E) => R
  ): R;

  // -- Side Effects --
  abstract tap(fn: (data: T) => void): ResultBase<T, E>;
  abstract tapError(fn: (error: E) => void): ResultBase<T, E>;

  // -- Unwrapping --
  abstract unwrap(): T;
  abstract unwrapOr(defaultValue: T): T;
}
```

**Why abstract class (not alternatives):**

| Approach | Verdict | Reason |
|----------|---------|--------|
| Abstract class (recommended) | **USE** | Enables `Success<T>` / `Failure<E>` subclass polymorphism per Base_System.md §3.1; `instanceof` type guards work in base validators; methods are inherited, not duplicated |
| Union type `type Result<T,E> = Success<T> | Failure<E>` | **REJECT for inner layers** | Cannot carry methods; violates OOP requirement for Domain/Application/Infrastructure layers per Architecture.md §3 |
| Plain object with static helpers | **REJECT for inner layers** | No method chaining (`result.map().flatMap().match()`); no inheritance for layer-specific extensions (DomainResult adds `.validate().persist()`, ApplicationResult adds `.log().metrics()`) |
| Abstract class with private constructor + static factory | **USE for Foundations** | `ResultBase.succeed(data)` / `ResultBase.fail(error)` factory pattern controls construction; subclasses call super |

**Success/Failure concrete patterns (for Foundations layer, not Kernel):**

```typescript
// Foundations layer — example pattern (implemented in Phase 2+)
class Success<T, E> extends ResultBase<T, E> {
  readonly _tag = 'Success' as const;
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(private readonly dataValue: T) {
    super();
  }

  map<U>(fn: (data: T) => U): ResultBase<U, E> {
    return new Success(fn(this.dataValue));
  }

  flatMap<U>(fn: (data: T) => ResultBase<U, E>): ResultBase<U, E> {
    return fn(this.dataValue);
  }

  match<R>(handlers: { onSuccess: (data: T) => R; onFailure: (error: E) => R }): R {
    return handlers.onSuccess(this.dataValue);
  }

  fold<R>(onSuccess: (data: T) => R, onFailure: (error: E) => R): R {
    return onSuccess(this.dataValue);
  }

  tap(fn: (data: T) => void): ResultBase<T, E> {
    fn(this.dataValue);
    return this;
  }

  tapError(_fn: (error: E) => void): ResultBase<T, E> {
    return this;
  }

  unwrap(): T { return this.dataValue; }
  unwrapOr(_defaultValue: T): T { return this.dataValue; }
  // mapError: not possible on Success — return as-is
  mapError<F>(_fn: (error: E) => F): ResultBase<T, F> {
    return this as unknown as ResultBase<T, F>;
  }
}

class Failure<T, E> extends ResultBase<T, E> {
  readonly _tag = 'Failure' as const;
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(private readonly errorValue: E) {
    super();
  }

  map<U>(_fn: (data: T) => U): ResultBase<U, E> {
    return this as unknown as ResultBase<U, E>;
  }

  flatMap<U>(_fn: (data: T) => ResultBase<U, E>): ResultBase<U, E> {
    return this as unknown as ResultBase<U, E>;
  }

  match<R>(handlers: { onSuccess: (data: T) => R; onFailure: (error: E) => R }): R {
    return handlers.onFailure(this.errorValue);
  }

  fold<R>(onSuccess: (data: T) => R, onFailure: (error: E) => R): R {
    return onFailure(this.errorValue);
  }

  tap(_fn: (data: T) => void): ResultBase<T, E> {
    return this;
  }

  tapError(fn: (error: E) => void): ResultBase<T, E> {
    fn(this.errorValue);
    return this;
  }

  unwrap(): T { throw new Error('Cannot unwrap a Failure'); }
  unwrapOr(defaultValue: T): T { return defaultValue; }
  mapError<F>(fn: (error: E) => F): ResultBase<T, F> {
    return new Failure(fn(this.errorValue));
  }
}
```

**Key design decisions:**
1. **`_tag` discriminant on the abstract class** — enables `switch(result._tag)` pattern matching at the Result level, not just the Error level. The `'Success' | 'Failure'` literal union is narrowable.
2. **`as unknown as ResultBase<...>` casts in pass-through methods** — unavoidable when upcasting generic type parameters. Confined to the concrete classes; callers never see them.
3. **No `toJSON()` on the abstract class** — serialization is a Presentation layer concern. OOP layers never serialize. This prevents accidental class serialization across RSC boundary.
4. **Methods return `ResultBase<U, E>` not `this`** — preserves type flexibility when chaining across transformed types.

**Confidence:** HIGH — pattern matches Rust's `Result<T, E>`, verified against multiple TypeScript Result implementations (dennisokeeffe, znck, szymdzum, ofershap, maryanmats), and matches Base_System.md §3.1 spec exactly.

---

### Pattern 3: Discriminated Union for Presentation Layer

**RECOMMENDED: Plain object types with `_tag` discriminant, `as const` assertions, and `assertNever` exhaustiveness**

```typescript
// src/core/foundations/presentation/errors/presentation-error.ts
// (Kernel only defines the TYPE; values are created in Foundations)

export type PresentationError =
  | {
      readonly _tag: 'ValidationError';
      readonly fieldErrors: Readonly<Record<string, string>>;
      readonly userMessage: string;
    }
  | {
      readonly _tag: 'NotFoundError';
      readonly userMessage: string;
      readonly suggestedAction?: string;
    }
  | {
      readonly _tag: 'AuthorizationError';
      readonly userMessage: string;
      readonly requiredPermission?: string;
    }
  | {
      readonly _tag: 'SystemError';
      readonly userMessage: string;
      readonly errorCode: string;
      readonly severity: 'warning' | 'error' | 'critical';
    }
  | {
      readonly _tag: 'NetworkError';
      readonly userMessage: string;
      readonly retryable: boolean;
    };

// Exhaustiveness check helper
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled variant: ${JSON.stringify(value)}`);
}
```

```typescript
// src/core/foundations/presentation/results/presentation-result.ts
import type { PresentationError } from '../errors/presentation-error';
import { assertNever } from '../../base/helpers/assert-never';

export type PresentationResult<T> =
  | {
      readonly _tag: 'Success';
      readonly data: T;
      readonly metadata?: {
        readonly operationId: string;
        readonly duration: number;
        readonly timestamp: string;
      };
    }
  | {
      readonly _tag: 'Failure';
      readonly error: PresentationError;
      readonly metadata?: {
        readonly operationId: string;
        readonly timestamp: string;
        readonly retryAfter?: number;
      };
    };

// Helper constructors (plain factory functions, not methods on types)
export function success<T>(
  data: T,
  metadata?: PresentationResult<T> extends { _tag: 'Success' } ? PresentationResult<T>['metadata'] : never
): PresentationResult<T> {
  return { _tag: 'Success', data, ...(metadata ? { metadata } : {}) } as const;
}

export function failure<T>(
  error: PresentationError,
  metadata?: PresentationResult<T> extends { _tag: 'Failure' } ? PresentationResult<T>['metadata'] : never
): PresentationResult<T> {
  return { _tag: 'Failure', error, ...(metadata ? { metadata } : {}) } as const;
}

// Type guard
export function isSuccess<T>(result: PresentationResult<T>): result is Extract<PresentationResult<T>, { _tag: 'Success' }> {
  return result._tag === 'Success';
}

export function isFailure<T>(result: PresentationResult<T>): result is Extract<PresentationResult<T>, { _tag: 'Failure' }> {
  return result._tag === 'Failure';
}
```

**Usage in a Server Action (Foundation layer):**

```typescript
'use server';

export async function createOrderAction(formData: FormData): Promise<PresentationResult<OrderDTO>> {
  // ... call Application layer ...
  const appResult = await createOrderUseCase.execute(command);

  return appResult.match({
    onSuccess: (order) => success(mapToDTO(order)),
    onFailure: (appError) => {
      switch (appError._tag) {
        case 'ValidationError':
          return failure({ _tag: 'ValidationError', fieldErrors: appError.fields, userMessage: appError.message });
        case 'AuthorizationError':
          return failure({ _tag: 'AuthorizationError', userMessage: 'You do not have permission' });
        // ... exhaustive handling via assertNever in default ...
        default:
          return assertNever(appError);
      }
    },
  });
}
```

**Why `_tag` (not `type`, `kind`, `status`):**

| Convention | Verdict | Reason |
|------------|---------|--------|
| `_tag` | **USE** | Underscore prefix signals "this is a discriminant, not business data"; convention from Effect/fp-ts ecosystem; avoids collision with `type` keyword in TypeScript |
| `type` | **REJECT** | Collides with TypeScript's `type` keyword; `result.type` reads awkwardly when extracted |
| `kind` | **ACCEPTABLE** | Good alternative, used in Rust-style pattern matching; slightly less conventional in TypeScript ecosystem |
| `status` | **REJECT** | Too generic — suggests HTTP or lifecycle status, not type discrimination |

**Why no methods on Presentation DUs:**
- Per Architecture.md §6 rule #4: "❌ لا تضع سلوكاً (Methods) in Discriminated Unions"
- Plain objects survive `JSON.parse(JSON.stringify(x))` with all properties intact
- Methods would be lost across RSC serialization boundary
- Instead, use standalone functions (`isSuccess()`, `isFailure()`, `success()`, `failure()`)
- Runtime behavior goes in type guards (predicate functions), not methods

**Exhaustiveness enforcement:**
- Every `switch` over a DU must end with `default: assertNever(x)`
- Adding a new variant to the union produces a compile error at every consumption site
- This is the primary value proposition of DUs — the compiler prevents incomplete handling

**Confidence:** HIGH — matches TypeScript Handbook §Discriminated Unions, verified against multiple sources (Stanza, BetterStack, Convex, Mayallo), and aligns 100% with Base_System.md §2.2 and Architecture.md §3.

---

### Pattern 4: Enum vs Const Object for Severity, LayerType

**RECOMMENDED: `as const` objects with derived union types**

```typescript
// src/core/kernel/primitives/enums/severity.enum.ts

export const Severity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];
// Evaluates to: 'debug' | 'info' | 'warning' | 'error' | 'critical'
```

```typescript
// src/core/kernel/primitives/enums/layer-type.enum.ts

export const LayerType = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  PRESENTATION: 'presentation',
} as const;

export type LayerType = (typeof LayerType)[keyof typeof LayerType];
// Evaluates to: 'domain' | 'application' | 'infrastructure' | 'presentation'
```

**Why `as const` objects over `enum`:**

| Aspect | `enum` / `const enum` | `as const` object | Verdict |
|--------|----------------------|-------------------|---------|
| Runtime code | `enum` generates IIFE with reverse mapping; `const enum` inlines | Zero — plain object | `as const` wins |
| Tree-shaking | Not tree-shakeable (enum is value + type) | Fully tree-shakeable | `as const` wins |
| Type safety | String enums: equates to `string` in many contexts; numeric: reverse mapping bloat | Literal union type — exact values | `as const` wins |
| Reverse mapping | `enum` generates `{0: 'Up', Up: 0}` — never needed here | Not generated | `as const` wins |
| Cross-module consistency | `const enum` has `isolatedModules` issues | Works with all module systems | `as const` wins |
| Iteration | `Object.values(Severity)` works on both | Works the same | Tie |
| Pattern matching in switch | `case Severity.ERROR:` vs `case 'error':` | Both work; literal strings are more debuggable in logs | `as const` wins |

**The `as const` pattern is the TypeScript team's recommended modern approach** (per TS Handbook "Objects vs Enums" section). The TS team has explicitly suggested this since TS 3.4.

**The one case where `enum` might be preferred:** Public library APIs where consumers should not depend on literal values. This project is an application, not a library. Use `as const`.

**`satisfies` for type narrowing where needed:**

```typescript
const severityLookup = {
  [Severity.DEBUG]: 0,
  [Severity.INFO]: 1,
  [Severity.WARNING]: 2,
  [Severity.ERROR]: 3,
  [Severity.CRITICAL]: 4,
} as const satisfies Record<Severity, number>;
```

**Confidence:** HIGH — TypeScript Handbook officially recommends `as const` over `enum`; verified against TS 5.7 behavior; decision analysis matches LogRocket, Total TypeScript, and Axel Rauschmayer's analysis.

---

### Pattern 5: Zero-Dependency Kernel Layer

**Constraint:** Per PROJECT.md, Kernel layer must have **zero external dependencies**.

**What this means for each construct:**

| Construct | Dependency Required? | How to Achieve Zero-Dep |
|-----------|---------------------|--------------------------|
| Branded types (`Brand<T, K>`) | No | Pure type-level pattern, erased at compile time |
| Type guards (`isSuccess`, `isFailure`) | No | Plain TypeScript functions |
| `ResultBase<T, E>` abstract class | No | Pure TypeScript — compiler handles this |
| Severity / LayerType constants | No | `as const` objects — plain JavaScript |
| ErrorCode constants | No | String literal values |
| Exhaustiveness helpers (`assertNever`) | No | Plain function with `never` parameter |
| UUID validation (CorrelationId) | No | Regex validation in constructor function — no `uuid` package needed |
| Serialization | No | No serialization in Kernel — deferred to Presentation layer |

**What we explicitly avoid:**

```typescript
// ❌ NO: External libraries in Kernel
import { z } from 'zod';                          // NO — validation library
import { Brand } from 'effect';                   // NO — Effect ecosystem
import { Result } from 'neverthrow';              // NO — Result library
import { v4 as uuid } from 'uuid';                // NO — UUID generator
import { match } from 'ts-pattern';               // NO — Pattern matching library
import { Ok, Err } from 'true-myth';              // NO — ADT library

// ✅ YES: Pure TypeScript
type CorrelationId = Brand<string, 'CorrelationId'>;
function CorrelationId(v: string): CorrelationId { /* validation */ }
```

**Why zero-dependency matters:**
1. Kernel is the **foundation** — every layer imports from it. A dependency here propagates to the entire project.
2. Minimizes **supply chain risk** — the type system + language features handle everything needed.
3. **Tree-shaking** — no dead code from unused library features.
4. **Future-proof** — the patterns are pure TypeScript, not tied to any library's API surface.

**Confidence:** HIGH — PROJECT.md explicitly requires this; all patterns verified to be implementable in pure TypeScript.

---

### Pattern 6: TypeScript Strict Mode for Maximum Safety

**Current state:** `"strict": true` (good)
**Target state for Phase 1:**

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

**What each flag catches in this codebase:**

| Flag | Bug It Prevents | Example |
|------|----------------|---------|
| `noUncheckedIndexedAccess` | Accessing `result[someIndex]` without checking bounds | `errors[i].message` — if `errors` is sparse, this is `undefined` |
| `noImplicitOverride` | Layer subclass method that accidentally doesn't override parent | `DomainResult.map()` without `override` — silently defines new method |
| `verbatimModuleSyntax` | Importing a type as a value (violates zero-dep stance) | `import { ResultBase } from './result-base'` instead of `import type` |
| `exactOptionalPropertyTypes` | `metadata?: {...}` field set to `undefined` explicitly | `{ _tag: 'Success', data: x, metadata: undefined }` — rejected |
| `target: "ES2022"` | Classes across RSC boundary lose private fields | `#field` syntax requires ES2022 |
| `strict: true` (already set) | Null/undefined crashes, implicit any, bad `this` | Already baseline |

**NOT enabling (with rationale):**

| Flag | Why Not |
|------|---------|
| `noUnusedLocals` | Biome handles this; TS flag slows compilation in large workspaces |
| `noUnusedParameters` | Overly strict during phased development — unused params signal incomplete impl |
| `noFallthroughCasesInSwitch` | Biome covers it; `assertNever` in default already catches missings |
| `noImplicitReturns` | Can hide incomplete implementation — explicit returns preferred for clarity |

**Confidence:** HIGH — verified against Total TypeScript tsconfig cheat sheet, TS Handbook, and practical experience.

---

## Alternatives Considered (Full Comparison)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Brand implementation | `unique symbol` key + string tag (hybrid) | Plain string `__brand` | Collision risk across modules in layered architecture |
| Result pattern | Abstract class (OOP) | Discriminated Union | DU can't carry methods for layer-specific behavior (`.log()`, `.retry()`) |
| Result pattern | Abstract class (OOP) | Interface + helper functions | No inheritance for layer-specific extensions, no `instanceof` type guards |
| Enum pattern | `as const` object | `enum` | Reverse mapping bloat, tree-shaking resistance, `isolatedModules` issues |
| Enum pattern | `as const` object | `const enum` | Doesn't work with `isolatedModules`, no runtime object for iteration |
| Discriminant name | `_tag` | `type` / `kind` / `status` | `type` collides with keyword; `_tag` is ecosystem standard (Effect/fp-ts) |
| Presentation Result | Plain DU objects | Class with `toJSON()` | Methods lost across RSC serialization — violates Architecture.md |
| Validation runtime | None in Kernel | Zod / Valibot | Zero-dep constraint; validation added later at Infrastructure boundary |
| UUID generation | Regex validation only | `uuid` npm package | Zero-dep constraint; CorrelationId is validated, not generated, in Kernel |

---

## Installation (Phase 1 — No New Packages)

For Phase 1 Kernel layer, the only change is TypeScript compiler options in `tsconfig.json`:

```jsonc
// tsconfig.json — changes only (merge with existing)
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "exactOptionalPropertyTypes": true
  }
}
```

For Phase 2+ (Foundations), these libraries are **candidates** (not yet decided):

```bash
# Future consideration — NOT installed in Phase 1
npm install -D ts-pattern    # For advanced pattern matching on DUs (optional)
npm install uuid             # For CorrelationId generation at application boundary
```

**No npm packages are installed in Phase 1.** The entire Kernel is pure TypeScript.

---

## Sources

| Source | What It Confirmed | Confidence |
|--------|-------------------|------------|
| [TypeScript Handbook — Enums vs Objects](https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums) | `as const` objects over `enum` | HIGH |
| [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) | `strict` flag composition, additional strict options | HIGH |
| [TypeScript issue #61479 — `brand` keyword RFC](https://github.com/microsoft/TypeScript/issues/61479) | Current branded type landscape, unique symbol mechanics | HIGH |
| [DEV: Branded Types — Cheap Type Safety (2026)](https://dev.to/gabrielanhaia/branded-types-in-typescript-cheap-type-safety-you-should-already-be-using-1dmk) | Branded type patterns, unique symbol vs string comparison | HIGH |
| [DEV: Opaque Types Without unique symbol (2026)](https://dev.to/gabrielanhaia/opaque-types-without-unique-symbol-a-lighter-branded-types-pattern-2ohf) | Trade-off analysis of brand patterns | HIGH |
| [Stanza — Discriminated Unions Guide](https://www.stanza.dev/concepts/typescript-discriminated-unions) | DU patterns, naming conventions | HIGH |
| [Designing a Result Type in TypeScript — znck (2025)](https://znck.dev/articles/2025-11-22-designing-a-result-type/) | Abstract class Result pattern | MEDIUM |
| [Creating a Result Type — Dennis O'Keeffe (2024)](https://blog.dennisokeeffe.com/blog/2024-07-14-creating-a-result-type-in-typescript) | Abstract class vs union Result patterns | MEDIUM |
| [Total TypeScript — TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) | Recommended tsconfig strictness options | HIGH |
| [TypeScript Enums Showdown — DEV (2025)](https://dev.to/maximlogunov/typescript-enums-showdown-const-enum-vs-enum-vs-object-as-const-4dg8) | `as const` vs enum comparative analysis | HIGH |
| [2ality — TypeScript enum patterns (2025)](https://2ality.com/2025/01/typescript-enum-patterns.html) | When to use enum vs alternatives | HIGH |
| [PROJECT.md](../PROJECT.md) | Zero-dependency constraint, layered architecture | — |
| [Base_System.md](../../docs/Base_System.md) | ResultBase spec, ErrorBase spec, layer rules | — |
| [Architecture.md](../../docs/Architecture.md) | OOP vs DU boundaries, serialization rules | — |

---

## Open Questions / Future Validation Points

1. **Should the `Brand` helper use a different symbol key per type?** (Currently uses one `__brand` symbol shared across all brands. This is acceptable because the string tag differentiates types within the same project. If cross-project collision becomes a concern, switch to per-type `declare const` symbols — but that adds verbosity for no current benefit.)

2. **Should `fold` and `match` both exist on ResultBase?** (Spec defines both. They serve the same purpose with different call signatures. `fold` takes two positional functions; `match` takes a handlers object. Both are included per spec, but in practice, pick one per team convention to avoid confusion. Recommendation: keep both, document that `match` is preferred for clarity.)

3. **Should Presentation DU constructors validate inputs?** (Currently they do not — they trust the mapper layer. Consider adding runtime validation if Presentation errors cross untrusted boundaries.)

4. **ES2022 target compatibility?** (Verify Next.js build pipeline handles ES2022 output. If not, ES2020 is the minimum for Error.cause compatibility.)
