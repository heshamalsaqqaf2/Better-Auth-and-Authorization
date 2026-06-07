# Domain Pitfalls: Layered Error & Result System

**Domain:** TypeScript Error/Result system for Next.js 16 with 4-layer architecture (Domain, Application, Infrastructure, Presentation)
**Researched:** 2026-06-07
**Overall confidence:** HIGH — most pitfalls confirmed by multiple production post-mortems and official documentation

---

## Critical Pitfalls

Mistakes that cause silent data corruption, production outages, or architectural rewrites.

### Pitfall CRIT-1: Branded Types Stripped by Serialization (Silent Type Erasure)

**What goes wrong:** Branded types (`CorrelationId`, `ErrorCode`, `OperationId`) are compile-time-only phantom properties. When a branded value crosses `JSON.parse`/`JSON.stringify` or the RSC serialization boundary, the brand is silently lost. Code that downstream expects a `CorrelationId` receives a plain `string`, but TypeScript still _believes_ it's branded because the `as` cast was done before serialization. Result: the type system lies, and the runtime doesn't catch cross-type confusion (e.g., passing an `ErrorCode` where `OperationId` is expected).

```typescript
// BAD: brand is cast before serialization, silently lost after
const correlationId = rawStr as CorrelationId;
const serialized = JSON.stringify(correlationId);
// ... later, deserialized:
const deserialized = JSON.parse(serialized) as CorrelationId; // LIE — it's just a string
```

**Why it happens:**
- Developers assume brands survive JSON round-trips because TypeScript shows no error
- The `as` cast makes the compiler happy but doesn't validate at runtime
- No re-construction step at deserialization boundaries

**Consequences:**
- Silent type confusion: `ErrorCode` used where `OperationId` expected (or vice versa)
- Correlation chain breaks — logs from same operation can't be correlated
- Debugging hell: bug only manifests in production under specific conditions

**Prevention:**
- **Mandatory factory functions for all branded types** — never export branded types with raw `as` casts at call sites
- **Re-validate at every deserialization boundary** — every branded value that arrives from JSON, database, or RSC payload must go through its factory validator again
- **Use `unique symbol` brands, not string literals** — prevents accidental structural compatibility across modules (string `__brand: 'UserId'` can collide; `unique symbol` cannot)
- **Kernel-level `Brand<T, B>` utility** — single generic helper used everywhere, not ad-hoc patterns

```typescript
// GOOD: factory function that can be called after deserialization
const CorrelationId = {
  create(raw: string): CorrelationId {
    // Validate format if needed
    return raw as CorrelationId;
  },
  reconstruct(raw: string): CorrelationId {
    // Called after JSON.parse — same path as create
    return this.create(raw);
  },
};
```

**Detection:** Add a runtime check helper `isBranded<T>(val, guard)` that all cross-boundary validation must call. Audit: grep for `as CorrelationId`, `as ErrorCode`, `as OperationId` outside factory files — every raw cast outside a factory is a bug.

**Phase mapping:** Phase 1 (Kernel) when branded types are defined. The factory pattern and `Brand<T, B>` utility must be specified in Kernel contracts, not left as an implementation detail for later phases.

---

### Pitfall CRIT-2: OOP Result Classes Crossing the RSC Serialization Boundary

**What goes wrong:** A `DomainResult` or `ApplicationResult` (OOP class with methods like `.map()`, `.match()`, `.tap()`) is returned from a Server Action or passed Server Component → Client Component. Next.js's RSC serializer strips the prototype chain. The client receives a plain object — all methods are gone. The code compiles fine because TypeScript infers the class type, but at runtime `.match()` is `undefined`.

```typescript
// SERVER ACTION — WRONG
export async function createUser(data: FormData): Promise<ApplicationResult<UserDTO, AppError>> {
  const result = await userService.create(data);
  return result; // 💥 Class instance — prototype will be stripped
}

// CLIENT — compiles but crashes at runtime
const result = await createUser(formData);
result.match({
  onSuccess: (user) => setUser(user), // TypeError: result.match is not a function
  onFailure: (err) => showError(err),
});
```

**Why it happens:**
- The architecture explicitly says "OOP for inner layers, DU at Presentation" but the boundary is missed in Server Actions
- TypeScript class types serialize without compiler warnings — only runtime crashes reveal the issue
- Next.js error messages are cryptic ("Only plain objects can be passed to Client Components") and don't point to the specific class
- Using `JSON.parse(JSON.stringify(result))` as a "fix" silently strips methods and corrupts `Date` objects, `Map`/`Set`, `undefined`, and `BigInt`

**Consequences:**
- Runtime `TypeError: result.match is not a function` in production
- `JSON.parse(JSON.stringify(...))` workaround silently corrupts data (Dates become strings, `undefined` fields vanish, `Map`→`{}`, `BigInt`→throws)
- Hard to trace: error surfaces in Client Component, root cause is in Server Action
- Inconsistent: some cases error, some silently pass with wrong data shape

**Prevention:**
- **Enforce the transformation point in code**: every Server Action must explicitly map `ApplicationResult<T>` → `PresentationResult<T>` (DU) before returning. This is non-negotiable.
- **Add a compile-time lint rule**: detect class-type return values from Server Actions. Use `no-instanceof-return` or custom ESLint rule.
- **Never use `JSON.parse(JSON.stringify(x))` for serialization** — use explicit field mapping or Zod/Valibot schemas at boundaries
- **Kernel should provide a `toPresentation()` helper** that all layers use as the single serialization gateway
- **Unit test each Server Action** for serialization safety: `expect(() => JSON.parse(JSON.stringify(action(input)))).not.toThrow()`

```typescript
// GOOD: explicit mapping at Server Action boundary
export async function createUser(data: FormData): Promise<PresentationResult<UserDTO>> {
  const result = await userService.create(data);
  return result.match({
    onSuccess: (user) => ({ _tag: 'Success', data: user.toDTO() }),
    onFailure: (err) => ({
      _tag: 'Failure',
      error: { _tag: 'SystemError', userMessage: err.message, errorCode: err.code, severity: 'error' },
    }),
  });
}
```

**Detection:** Next.js 16 throws `Error: Only plain objects, and a few built-ins, can be passed to Server Actions` during dev. Any occurrence in build output should trigger immediate inspection of every Server Action in the call chain.

**Phase mapping:** Phase when Server Actions are created. The Kernel must provide a `SerializationBoundary` contract or `toPresentation` type that forces explicit mapping. The Foundations layer's Presentation mappers are where the actual mapping logic lives.

---

### Pitfall CRIT-3: Layer Isolation Violation — Domain Importing Application or Infrastructure Types

**What goes wrong:** The clean architecture dependency rule is violated: a Domain entity, error, or result imports from Application or Infrastructure. This creates a circular dependency and destroys the entire architectural model. Once broken, every other isolation guarantee collapses.

```typescript
// Domain/errors/user-not-found.error.ts — WRONG
import { InfrastructureError } from '../../Infrastructure/errors/infrastructure-error';
// ❌ Domain depends on Infrastructure — violates Core Rule
```

**Why it happens:**
- Developer needs a utility that "should be shared" and imports from wherever it lives
- IDE autocomplete suggests types from outer layers
- Barrel files (`index.ts`) re-export everything, making cross-layer imports look normal
- No CI check catches it until the app breaks at runtime with circular dependency errors
- TypeScript itself doesn't prevent it (structural typing, not nominal)

**Consequences:**
- Circular import errors at build time (hard to trace which import caused it)
- Domain is no longer portable — can't extract it as a library or test it in isolation
- Infrastructure changes ripple into Domain (rebuild required for every ORM change)
- The entire "swap infrastructure without touching domain" promise is void
- Once one violation exists, more follow ("well, this one already imports from Infrastructure...")

**Prevention:**
- **Kernel contracts as the ONLY shared dependency** — Domain should only import from Kernel, not from other layers
- **Enforce with tooling in Phase 1**:
  - Add `import/no-restricted-paths` (ESLint) or equivalent: Domain may NOT import from Application, Infrastructure, or Presentation
  - Add a `dependency-cruiser` rule that blocks cross-layer dependency violations
  - CI must fail on any layer violation
- **Set the rule in stone during Kernel scaffolding** — once Domain files exist with incorrect imports, fixing them becomes a painful refactor
- **Domain errors must be self-contained** — a `DomainError` subclass cannot wrap an `InfrastructureError` or reference its types. It uses only Kernel primitives and its own properties.

```
# Dependency direction (enforced):
Domain       → Kernel only
Application  → Domain + Kernel
Infrastructure → Application + Domain + Kernel
Presentation → Application + Kernel (never Domain directly)
              → NEVER imports from Infrastructure
```

**Detection:** Run `npx depcruise src --ts-config tsconfig.json` after every build. Any violation should fail the pipeline. Grep for `from '../../(Infrastructure|Application|Presentation)'` inside `src/Core/Foundations/Domain/` files.

**Phase mapping:** Phase 1 (Kernel) must establish the import boundaries through tooling, not just documentation. Domain files should be created with `index.ts` that only re-exports from Kernel. If the Domain folder has no barrel, developers won't know what to import.

---

### Pitfall CRIT-4: Missing PresentationError Mapping Creates Information Leaks

**What goes wrong:** An `ApplicationError` or `InfrastructureError` (containing stack traces, database connection strings, internal IPs, SQL queries) is accidentally returned directly to the client without sanitization. The `PresentationError` mapping layer is skipped.

```typescript
// Server Action — WRONG (mapping step skipped)
export async function getUser(id: string): Promise<PresentationResult<User>> {
  const result = await userService.getUser(id);
  if (result.isFailure) {
    // ❌ Leaking InfrastructureError details to client!
    return { _tag: 'Failure', error: result.error }; // result.error is ApplicationError with stack trace
  }
  // ...
}
```

**Why it happens:**
- The mapping step is seen as "boilerplate" and skipped for convenience
- Developer assumes "it's just an error message" not realizing it contains internal details
- TypeScript structural typing doesn't prevent passing an `ApplicationError` where `PresentationError` is expected if shapes are similar
- Tight deadlines → "we'll add the mapper later" (later never comes)

**Consequences:**
- Security vulnerability: internal infrastructure details exposed in client response
- Attackers get DB hostnames, table names, internal API endpoints
- Stack traces reveal file paths, line numbers, and internal architecture
- GDPR/compliance issue if user IDs or personal data leak in error contexts
- Once leaked errors are in client logs, they persist permanently

**Prevention:**
- **Make `PresentationError` a strict DU with ONLY safe-for-client fields** — no `cause`, no `stack`, no `technicalDetails`
- **Make `PresentationResult.error` typed as `PresentationError` only** — cannot accept `ApplicationError` or `InfrastructureError` at compile time
- **Mandatory mapper step** — Kernel should provide a marker type `MappableToPresentation<T>` that forces explicit implementation
- **Never export `toJSON()` on inner-layer errors that includes stack or technical details** — if `InfrastructureError.toJSON()` exists, restrict it to `never` or add `@internal` JSDoc that tooling can enforce
- **Audit rule**: every Server Action must call a mapper — no inline error construction

```
PresentationError variants (safe only):
  _tag: 'ValidationError'  → fieldErrors, userMessage only
  _tag: 'NotFoundError'    → userMessage, suggestedAction?
  _tag: 'AuthorizationError' → userMessage, requiredPermission?
  _tag: 'SystemError'      → userMessage, errorCode, severity only (NO stack)
  _tag: 'NetworkError'     → userMessage, retryable only
```

**Detection:** Search Server Actions for `as PresentationError` or manual `_tag` construction without going through a mapper. Every Server Action return should reference a mapper function.

**Phase mapping:** Phase when Server Actions are implemented. The Presentation mappers (`application-to-presentation-error.mapper.ts`, `application-to-presentation-result.mapper.ts`) must be created before any Server Action that calls Application layer.

---

## High-Severity Pitfalls

### Pitfall HIGH-1: Result Monad Over-Engineering (Full fp-ts Style)

**What goes wrong:** The `ResultBase` abstract class defines full monad laws (Functor, Applicative, Monad) with `map`, `flatMap`, `mapError`, `fold`, `tap`, `tapError`, `bimap`, `ap` — bringing the full cognitive load of algebraic type theory into every error handler. Real-world experience shows that `Either` in Server Actions with side effects creates more ceremony than protection.

**Why it happens:**
- The architecture doc specifies Monad Laws explicitly
- Developers from functional backgrounds naturally reach for full monadic composition
- The "promise" of FP is beautiful — clean composition, no hidden control flow
- Reality: Next.js Server Actions have side effects everywhere (logs, cache revalidation, analytics) that don't fit a pure monadic model

**Consequences:**
- Code turns into nested `pipe(TE.tryCatch(...), TE.map(...), TE.chain(...))` — unreadable in code review after 5+ steps
- Every new developer needs a 2-page internal guide to understand `pipe(TE.tryCatch(...), TE.map(...))` vs `try/catch`
- Onboarding time increases significantly for non-FP developers
- `pipe()` chains with >6 steps become unreadable — intermediate values hidden in closures
- Bundle size: importing fp-ts-like patterns on client is 70KB+ unminified
- TypeScript inference breaks on long chains → intermediate types resolve to `unknown`

**Prevention:**
- **Use the pragmatic Result API from Base_System.md but implement as simple DU-inspired classes, not full monad** — `ok()`/`err()` constructors, `.match()`, `.map()`, `.unwrapOr()` is enough
- **For Server Actions, prefer simple DU** (`{ ok: true; data: T } | { ok: false; error: E }`) — 80% of benefit at 20% of cost (confirmed by multiple production experiences)
- **Reserve monadic composition for PURE data transformation chains** (e.g., validation pipelines), not for Server Actions with side effects
- **Limit `pipe()` chains to 5 steps max** — beyond that, extract named intermediate functions
- **Kernel ResultBase should be a contract, not a full implementation** — specify the minimum API that all layer results must satisfy, not the full monad laws
- **Explicitly annotate return types at each stage** — don't trust inference for composed chains

```
Minimal Result API (recommended over full monad):
  map<U>(fn: (data: T) => U) → Result<U, E>
  unwrapOr(default: T) → T
  match<R>(handlers: { ok: (data: T) => R; err: (error: E) => R }) → R
  isOk/isErr (type guards)
```

**Detection:** During code review, if a pipeline uses `.chain()`, `.flatMap()`, `.bimap()`, or has more than 5 composed operations, flag for simplification. Search for `TE.tryCatch` or `pipe` imports.

**Phase mapping:** Phase when Foundations implement ResultBase concretely. The decision on API surface must be made in the contract phase (Kernel) to avoid implementing a full monad that later must be stripped back.

---

### Pitfall HIGH-2: Discriminated Union with Classes (Splitting DU into Class Variants)

**What goes wrong:** The Presentation layer, which should use pure Discriminated Unions (plain objects with `_tag`), instead implements variants as classes extending a base. This adds prototype chains, breaks structured cloning, and defeats the entire purpose of using DU at the serialization boundary.

```typescript
// WRONG — classes in Presentation layer (defeats DU purpose)
abstract class PresentationError { abstract _tag: string; }
class ValidationError extends PresentationError {
  readonly _tag = 'ValidationError' as const;
  constructor(public fieldErrors: Record<string, string>, public userMessage: string) { super(); }
}
class SystemError extends PresentationError {
  readonly _tag = 'SystemError' as const;
  constructor(public userMessage: string, public errorCode: string) { super(); }
}
// ❌ structuredClone breaks on class instances
// ❌ prototype chain adds overhead for no benefit
```

**Why it happens:**
- The Domain, Application, and Infrastructure layers all use OOP classes — it's "how we do things here"
- Classes feel more "real" to OOP-background developers than plain object types
- Classes with `readonly _tag` look like discriminated unions but aren't — they carry prototype chains
- `instanceof` checks seem more reliable than comparing string discriminants

**Consequences:**
- RSC serialization strips the prototype → methods are gone, `instanceof` returns false
- `structuredClone()` fails on class instances in some environments
- Bundle size increases unnecessarily (class definitions shipped to client)
- Tree-shaking doesn't work on class methods
- The Hybrid Architecture promise collapses — if Presentation also uses classes, what was the point?

**Prevention:**
- **Strict rule: NO `class` keyword in Presentation layer files** — enforce with ESLint `no-class` rule
- **Presentation types are template literal + object literal only**:
  ```typescript
  type PresentationError =
    | { _tag: 'ValidationError'; fieldErrors: Record<string, string>; userMessage: string }
    | { _tag: 'SystemError'; userMessage: string; errorCode: string; severity: 'warning' | 'error' | 'critical' };
  ```
- **Use factory functions, not constructors**:
  ```typescript
  function validationError(fieldErrors: Record<string, string>): PresentationError {
    return { _tag: 'ValidationError', fieldErrors, userMessage: 'Invalid input' };
  }
  ```
- **Kernel should provide a marker** `type PresentationType = Record<string, unknown>` that all Presentation types extend — any `class` in Presentation violates it

**Detection:** Run `Find "class" in src/Core/Foundations/Presentation/` — should return zero results. Add ESLint rule `no-restricted-syntax: ["error", "ClassDeclaration"]` for Presentation directory.

**Phase mapping:** Phase 1 (Kernel) must define Presentation contracts as type-only (no abstract classes inherit from ErrorBase). If the contract specifies an abstract class, implementers will naturally create classes. The contract itself must enforce the DU pattern.

---

### Pitfall HIGH-3: `any` / `as` Escape Hatches That Bypass the Entire System

**What goes wrong:** Developers encounter type errors from the strict Result/Error system and reach for `as any` or `as unknown as T` to silence the compiler. Each cast creates a blind spot where the entire layered error system is bypassed — errors that should be caught propagate silently.

```typescript
function handler(input: unknown): ApplicationResult<UserDTO, AppError> {
  try {
    const data = input as SomeType; // ❌ bypasses validation
    // If input is malformed, this never returns an ApplicationResult
    // — it throws, and the caller gets an untyped exception
  } catch (e) {
    return err(new AppError(e as Error)); // ❌ as Error assumes shape
  }
}
```

**Why it happens:**
- Strict type errors are frustrating during development
- "I know this is safe" mentality — especially when refactoring
- Pressure to ship → `as any` is the fastest fix
- No CI rule catches it
- Each `as` cast justifies the next ("we already have 5, one more won't hurt")

**Consequences:**
- Creates "holes" in the error containment system — errors escape typed boundaries
- Downstream code receives unexpected shapes → `undefined is not an object` errors
- Correlation IDs lost because error didn't go through typed creation
- Audit trail broken — errors that should have been logged silently disappear
- Over time, the entire Error/Result system becomes a facade with the real errors flowing outside it

**Prevention:**
- **Ban `as` casts in all core error/result files** — use Zod/Valibot validation + factory functions instead
- **ESLint rule `@typescript-eslint/no-unnecessary-type-assertion` + `@typescript-eslint/no-explicit-any`** — set to `error`
- **Smart constructors with validation** — every branded type must have a constructor that validates input; no raw casts outside factories
- **Consider `exactOptionalPropertyTypes: true`** in tsconfig to catch missing fields
- **Code review checklist item**: "Does this file contain `as` casts that bypass the type system?"
- **Use the `satisfies` operator instead of `as`** for compile-time validation without runtime bypass

**Detection:** `grep -r '\bas\b' src/Core/ | grep -v '.test.' | grep -v 'node_modules'` — every result is a potential bypass. Each must be justified with a comment explaining why it's safe.

**Phase mapping:** Phase 1 (Kernel). The Kernel's branded type factories must be the ONLY place `as` casts are allowed. Every other cast in later phases is a code smell.

---

### Pitfall HIGH-4: Circular Dependencies via Barrel Files

**What goes wrong:** Barrel files (`index.ts`) that re-export everything create circular dependency chains: `Kernel/contracts/base/index.ts` imports from `Kernel/contracts/index.ts` which imports from `Kernel/contracts/base/index.ts`. These circular refs compile fine in TypeScript but create runtime issues — undefined exports, import order sensitivity, and silent failures.

```
index.ts (contracts) ──► base/index.ts
      ▲                         │
      │                         ▼
      └─────── index.ts (base) ◄── base/error-base.contract.ts
                                    (re-exported via base/index.ts)
```

**Why it happens:**
- "Everything from contracts should be available from one import" — too many re-exports
- Auto-generated barrel files from scaffolding tools
- Adding exports without checking if circular refs are created
- TypeScript doesn't error on circular barrels — only runtime reveals the issue

**Consequences:**
- Imports inside Kernel evaluate to `undefined` at runtime
- Exported constants are `undefined` when evaluated
- Error class constructors throw "is not a constructor"
- Hard to debug: stack traces don't point to the circular export, they point to the consumer
- Different behavior in dev vs production (bundlers handle circular deps differently)

**Prevention:**
- **Flat import structure within Kernel**: no nesting deeper than 2 levels. `src/Core/Kernel/contracts/base/` exports to `src/Core/Kernel/contracts/index.ts`, NOT to `src/Core/Kernel/index.ts` which also re-exports the same.
- **Kernel barrel should NOT re-export nested barrels** — it should only re-export from its immediate children (contracts, primitives, constants), which can each re-export their children.
- **Use `dependency-cruiser` to detect cycles** — run `npx depcruise src/Core/Kernel --ts-config tsconfig.json` and fail on cycles
- **Prefer direct imports from Kernel** for foundations: `import { ErrorCode } from '@/Core/Kernel/primitives/types'` instead of `import { ErrorCode } from '@/Core/Kernel'` — especially in Core code where performance matters
- **Test Kernel imports in isolation**: `node -e "require('./src/Core/Kernel')"` should succeed without errors

```
Safe barrel pattern:
  Kernel/index.ts
    exports from: contracts/index.ts, primitives/index.ts, constants/index.ts
    DOES NOT export from: contracts/base/index.ts directly
  
  contracts/index.ts
    exports from: base/index.ts, validators/index.ts
    // OK — single level re-export
  
  contracts/base/index.ts
    exports from: error-base.contract.ts, result-base.contract.ts
    // Terminal leaf — no re-export back up
```

**Detection:** Run `npx madge --circular src/Core/Kernel/index.ts` in CI. Any result means a circular dependency.

**Phase mapping:** Phase 1 (Kernel). The barrel structure must be designed before files are created — fixing barrel structure after files exist is a painful refactor.

---

## Moderate Pitfalls

### Pitfall MOD-1: Adding Methods to Discriminated Unions (DU Behavior Leak)

**What goes wrong:** A pure DU type (plain object with `_tag`) accumulates methods, computed properties, or static helpers attached to the type. This breaks the "dumb data" contract, creates serialization issues, and couples behavior to shape.

```typescript
// WRONG — behavior attached to Presentation types
type PresentationError =
  | { _tag: 'ValidationError'; fieldErrors: Record<string, string>; userMessage: string }
  | { _tag: 'SystemError'; userMessage: string; errorCode: string; severity: string };

// ❌ Helper functions that operate on the union type
function getPresentationErrorMessage(error: PresentationError): string {
  // This should be a standalone function, not attached
}
```

**Why it happens:**
- OOP habit: "data should know how to format itself"
- Convenience: putting `isValidationError()` on the type seems cleaner than a separate function
- Over time, utility functions migrate from standalone modules onto the type definition

**Consequences:**
- Violates the Hybrid Architecture principle: "DU = dumb data, OOP = behavior"
- Makes tree-shaking less effective (methods on types are harder to shake)
- Creates serialization concerns if methods somehow become enumerable
- Blurs the architectural line: "If Presentation has behavior, why not just use classes?"

**Prevention:**
- **Presentation types are PURE data — zero methods, zero getters** (use `Object.freeze` or `Readonly` types)
- **All behavior on Presentation types is in standalone functions** — `formatError(error: PresentationError, locale: string): string`, NOT `error.format(locale)`
- **Use `interface` or `type` only, never `class`** in Presentation files
- **Structure Presentation helpers in `/mappers/` and `/utils/` folders**, separate from type definitions

**Detection:** Search for `function` keyword inside Presentation type definition files. Functions should only exist in `*.mapper.ts` or `*.utils.ts` files.

**Phase mapping:** Phase when Presentation types are implemented. The pattern must be enforced from the first DU definition — it's harder to remove behavior than to never add it.

---

### Pitfall MOD-2: Under-Abstraction — Leaking Infrastructure into Use Cases

**What goes wrong:** Application Use Cases call database/Infrastructure code directly instead of through abstractions. This creates tight coupling to specific implementations (Drizzle, Redis, S3) and makes testing impossible without spinning up the real infrastructure.

```typescript
// Application/use-cases/create-order.ts — WRONG
export class CreateOrderUseCase {
  async execute(input: CreateOrderDTO): Promise<ApplicationResult<Order, AppError>> {
    // ❌ Direct database call — Application depends on Infrastructure
    const db = drizzle(process.env.DATABASE_URL!); // Leak!
    const result = await db.insert(orders).values(input);
    // ❌ Error handling is ad-hoc
    if (!result) {
      return err(new AppError('Failed to create order', 500));
    }
    return ok(result);
  }
}
```

**Why it happens:**
- "It's faster to write" — adding the repository abstraction seems like unnecessary indirection
- "We'll add the abstraction when we need it" — but the need never arrives because tests are impossible
- The Application layer is the thickest layer (orchestration), so developers just add code here
- No architectural review catches it during PR

**Consequences:**
- Can't unit test Use Cases without a real database
- Changing databases (Postgres → MySQL) requires rewriting Use Cases
- Error handling is inconsistent — each Use Case invents its own
- Domain rules get mixed with persistence concerns
- The entire "swap infrastructure" promise of Clean Architecture is void

**Prevention:**
- **Every Application Use Case receives its dependencies through constructor injection** — no direct imports of Drizzle, Redis, S3, etc.
- **Repository interfaces are defined in Application (or Domain)** — the concrete implementation lives in Infrastructure
- **Use Cases should only call repositories and domain services**, never ORM methods
- **Dependency Injection Container (Composition Root)** instantiates all dependencies — individual classes don't create their own
- **Test each Use Case with mock repositories** — this validates the abstraction boundary actually works

```typescript
// Application/use-cases/create-order.ts — GOOD
import { IOrderRepository } from '@/Core/Foundations/Application/ports/order-repository.port';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateOrderDTO): Promise<ApplicationResult<OrderDTO, AppError>> {
    // Pure orchestration — no infrastructure details
    const order = Order.create(input); // Domain entity
    if (order.isFailure) return err(order.error);
    
    const saved = await this.orderRepo.save(order.value);
    await this.eventBus.publish(new OrderCreatedEvent(saved));
    return ok(saved.toDTO());
  }
}
```

**Detection:** Review every Use Case for direct imports from `drizzle-orm`, `redis`, `@aws-sdk/*`, or any Infrastructure package. These should only appear in Infrastructure layer files.

**Phase mapping:** Phase when Use Cases are implemented. The interfaces (`IOrderRepository`) must exist before the Use Case is written. The Composition Root setup (scaffolded but empty) needs to be fleshed out before first Use Case.

---

### Pitfall MOD-3: Over-Abstraction — Boilerplate Before Business Value

**What goes wrong:** Every layer gets its own complete set of files — contract, validator, type-guard, mapper — even for trivial operations. A simple "get user by ID" requires: `IUserRepository` interface, `UserRepositoryImpl` class, `GetUserUseCase` class, `GetUserDTO`, `UserMapper`, `UserResponseDTO`, `UserNotFoundError`, `UserResult type guard`, `UserError validator`... The mapping tax means any field change requires updates in 4+ files.

**Why it happens:**
- The architecture docs specify a complete file structure per layer (error, result, contract, validator, type-guard, specific sub-types)
- "Following the architecture" is interpreted as "create every file in the structure" regardless of need
- Premature generalization: "we might have 50 entities, so we need the full pattern for all"
- No feedback loop: nobody measures whether all these files actually prevent bugs or just create work

**Consequences:**
- Every field change touches 4+ files → low team velocity
- 80% of "validators" and "type guards" test nothing the compiler doesn't already check
- New developer onboarding: "Why is there a type guard AND a validator AND a contract for the same type?"
- Code navigation: "Go to Definition" lands on an interface with one implementation named `XxxImpl`
- The "architecture" becomes the bottleneck for shipping features
- Developers start working around the architecture (see Pitfall HIGH-3: `as` casts)

**Prevention:**
- **YAGNI for validators and type guards**: don't create a validator or type-guard file until you have a concrete runtime validation need (e.g., user input, API response parsing)
- **Single-implementation interfaces are dead code**: don't create `IUserRepository` until you have a second implementation (mock, test, or alternate DB)
- **Contracts layer (Kernel) defines the shape** — most types need only the Kernel interface + one implementation, not 4 separate files
- **Phase 1 Kernel contracts should be lean** — define the minimum API surface that all layers agree on; don't define validators for types that only exist at compile time (brands, enums)
- **Review the file structure** from Base_System.md critically: do all 12+ validator files add value, or are they architectural theater?

> **Rule of thumb:** If removing a file from the structure won't cause any bugs or type errors, it shouldn't exist yet.

```
High-value files (keep):
  - error-base.contract.ts (kernel contract)
  - domain-error.ts (concrete class with real behavior)
  - application-to-presentation-error.mapper.ts (real transformation logic)

Low-value until proven (defer):
  - domain-error.validator.ts (what runtime validation does a domain error need?)
  - domain-result.type-guard.ts (is the guard checking something the compiler doesn't?)
  - Each specific error file (start with generic, extract when >2 uses)
```

**Detection:** Count files in `Foundations/*/errors/` vs actual unique error types used in the codebase. If file count > 3× the number of unique error types, you're over-abstracting.

**Phase mapping:** Phase 1 (Kernel) — the contracts must be lean. If the Kernel defines 5 validator contracts that all later layers must implement, the bloat is baked in from the start.

---

## Minor Pitfalls

### Pitfall MIN-1: Discriminator Property Name Inconsistency

**What goes wrong:** Some DU types use `_tag`, others use `kind`, `type`, or `tag` as the discriminator. This creates cognitive overhead — every module needs to check what its discriminant is called.

**Why it happens:**
- No naming convention enforced from the start
- Different libraries have different conventions (Redux uses `type`, Rust uses `tag`/`kind`)
- Different module authors choose different names

**Prevention:**
- **Kernel MUST define a constant `DISCRIMINANT = '_tag' as const`** — all Presentation DUs use `_tag`
- **ESLint rule**: enforce that discriminated union types in Presentation use `_tag` as the discriminant property
- **Code review**: reject any DU that uses `kind`, `type`, or `tag` instead of `_tag`

**Phase mapping:** Phase 1 (Kernel). Define `DISCRIMINANT` constant in Kernel constants.

---

### Pitfall MIN-2: `try/catch` Swallowing Unknown Errors with Generic 500

**What goes wrong:** Error handlers at layer boundaries catch all errors and return a generic "Internal Server Error" without re-throwing unknown errors. Real bugs get hidden behind `res.status(500).json({ error: 'Internal Server Error' })`.

```typescript
// WRONG — swallows unexpected errors silently
try {
  await someRiskyOperation();
} catch (error) {
  // ❌ Hides programming errors (TypeError, ReferenceError)
  return err(new AppError('Operation failed')); // Real bug is now invisible
}
```

**Prevention:**
- **Only handle KNOWN error types** — re-throw anything that isn't a domain/application error
- **Use `instanceof` checks** — only handle errors that match expected error types, re-throw everything else
- **Global unhandled error handler** catches everything that falls through
- **Logger must record the original error before wrapping** — never lose the `cause` chain

```typescript
// GOOD — distinguishes expected vs unexpected
try {
  return ok(riskyOperation());
} catch (error) {
  if (error instanceof DomainError || error instanceof InfrastructureError) {
    return err(error); // Expected — wrap and propagate
  }
  // Programming error or unknown — throw, don't swallow
  logger.error('Unexpected error in createOrder', error);
  throw error; // Caught by global handler
}
```

**Phase mapping:** Phase when cross-layer mappers and error boundaries are implemented. The pattern must be documented and enforced from first use.

---

### Pitfall MIN-3: `undefined` Handling Inconsistency in Result DUs

**What goes wrong:** Some result types use `null` for absence, others use `undefined`, others skip the property entirely. When serialized, `undefined` properties are dropped by `JSON.stringify` but preserved by the RSC serializer — inconsistent behavior across boundaries.

**Prevention:**
- **Kernel specifies: all optional fields use `?` with `undefined`** — never `null` in the Result/Error system
- **At RSC boundary**: fields that are `undefined` survive, but if using `JSON.stringify` for logging or caching, they vanish
- **Define a `toJSON()` on Result types** that explicitly handles `undefined` → `null` conversion for logging/caching, while keeping `undefined` for RSC boundary
- **Rule**: DU fields that are conditionally present use `property?: Type` not `property: Type | null`

**Phase mapping:** Phase 1 (Kernel). The contract for optional fields must specify behavior at serialization boundaries.

---

### Pitfall MIN-4: Error Cause Chain Becoming Too Deep or Circular

**What goes wrong:** Errors wrapped across layers accumulate `cause` chains that become circular (same error wrapped at multiple layers) or infinitely deep (every mapper wraps instead of translating).

**Prevention:**
- **Limit `cause` depth to 4 (one per layer)** — Domain → Application → Infrastructure → Presentation
- **Detect circular causes** — check that `error.cause` is not already in the chain before wrapping
- **Use `cause` for ADDITIONAL context, not duplication** — don't wrap just to change the type; translate instead
- **Add a `maxDepth` check** in the base error validator

**Phase mapping:** Phase when error mappers are implemented (Application and Presentation layers). Add cause chain validation early.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| **Phase 1 (Kernel)** | Branded types | Forgetting factories, raw `as` casts | Define `Brand<T,B>` utility + factory pattern in contracts. Only factories use `as`. |
| **Phase 1 (Kernel)** | Barrel files | Circular re-exports causing `undefined` at runtime | Use `dependency-cruiser` from day one. Flat max-2-level barrel structure. |
| **Phase 1 (Kernel)** | Contract surface area | Defining 10+ contracts when 3 suffice | YAGNI: contracts only for things that MUST be shared. Defer validators. |
| **Phase 2+ (Foundations: Domain)** | Domain imports Infrastructure | Violates dependency rule | ESLint `import/no-restricted-paths` configured in Phase 1. CI failure. |
| **Phase 2+ (Foundations: Application)** | Use Case coupling to DB | Direct Drizzle/Prisma calls instead of repos | Constructor injection required. Composition Root must be ready. |
| **Phase 2+ (Foundations: Presentation)** | DU with classes | `class` keyword in Presentation | ESLint `no-class` for Presentation directory. Enforce from first file. |
| **Phase 2+ (Foundations: Presentation)** | Mapper skipped | Returning ApplicationError from Server Action | Type-check: `PresentationResult.error` must be `PresentationError`, not `ApplicationError`. |
| **Phase 2+ (Server Actions)** | OOP Result crossing boundary | Class instances returned from Server Action | Mandatory `toPresentation()` call. Unit test serialization safety. |
| **Phase 3+ (Modules)** | Cross-module error coupling | Module A imports Module B's error types | Module errors are private. Only Kernel errors are shared across modules. |

---

## Architectural Blind Spots (Not Directly in Spec)

These aren't documented pitfalls but emerge from the architecture itself:

### Blind Spot A: Error Translation Strategy vs Wrapping Strategy

The spec says to use both, but doesn't specify WHEN to use which. Without guidance, teams will default to wrapping everything, creating chains 5+ deep. **Recommendation:** Use translation for Presentation boundary (user-facing messages), wrapping for cross-layer propagation (preserve cause chain for debugging).

### Blind Spot B: Testing Strategy for the Error/Result System

The spec defers tests, but the error/result system is inherently hard to test:
- Type-level guarantees (branded types, DU exhaustiveness) are compile-time only — runtime tests don't validate them
- Layer isolation violations are structural, not behavioral — unit tests won't catch them
- Serialization issues only surface when types cross boundaries — hard to test in isolation

**Recommendation:** Phase 1 should include a validation script (or test) that verifies Kernel import patterns, not full unit tests.

### Blind Spot C: Developer Experience Tax

The complete pattern (contract + type + class + validator + type-guard per error AND per result per layer) creates significant developer friction. The spec's 12+ validator files interact with every code change. **Recommendation:** Track "time to add a new error type" as a metric. If it exceeds 5 minutes including test updates, the abstraction overhead is too high.

---

## Sources

- [Branded Type Pitfalls — Stanza.dev](https://www.stanza.dev/courses/typescript-architecture/branded-types/typescript-architecture-nominal-typing) — HIGH confidence (Context7-verified)
- [Branded Type Common Mistakes — CodeClarityLab](https://codeclaritylab.com/glossary/typescript_branded_types) — HIGH confidence (official docs)
- [FP TypeScript in Production — Juanchi.dev](https://juanchi.dev/en/blog/functional-programming-typescript-production-patterns-that-survive) — MEDIUM confidence (production post-mortem, single source)
- [Clean Architecture Anti-Patterns — KruN](https://krun.pro/clean-architecture-anti-patterns/) — MEDIUM confidence (well-documented, aligns with multiple sources)
- [Next.js RSC Serialization Error — deadends.dev](https://deadends.dev/nextjs/rsc-serialization-error/) — HIGH confidence (verified against Next.js docs)
- [Server Action Serialization Error — deadends.dev](https://deadends.dev/nextjs/server-action-serialization-error/) — HIGH confidence (verified against Next.js source)
- [Next.js Issue #67224 — Server Action serialization inconsistency](https://github.com/vercel/next.js/issues/67224) — MEDIUM confidence (GitHub issue, reproducible)
- [Result Monad Over-engineering — Rahul Kadyan](https://znck.dev/articles/2025-11-22-designing-a-result-type/) — MEDIUM confidence (design post, aligns with other sources)
- [Clean Architecture Node.js — B2Tech Blog](https://blog.b2tech.io/en/clean-architecture-nodejs/) — MEDIUM confidence (well-structured guide)
- [Separation of Concerns — Tessl Labs](https://tessl.io/registry/tessl-labs/separation-of-concerns) — MEDIUM confidence (industry standard practices)
- [verdict-ts Result Library Analysis](https://dev.to/flyingsquirrel0419/i-tried-every-typescript-result-library-so-i-built-a-better-one-3a5h) — MEDIUM confidence (direct library comparison, single author)
- [Discriminated Union TypeScript Patterns — ResumeLens](https://www.resumelens.org/blog/typescript/typescript-discriminated-unions) — HIGH confidence (standard TypeScript patterns)
- [Project's own Base_System.md and Architecture.md] — HIGH confidence (source-of-truth for this project)
