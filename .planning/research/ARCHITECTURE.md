# Architecture Patterns: Layered Error & Result System

**Domain:** TypeScript/Next.js error and result handling
**Researched:** 2026-06-07
**Overall confidence:** HIGH (specification-backed with ecosystem validation)

---

## 1. System Architecture Overview

### 1.1 Five-Layer Model

The system follows a strict 5-layer architecture with one **Kernel** capstone layer:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION (DU)                     │
│  PresentationError (Discriminated Union)                 │
│  PresentationResult (Discriminated Union)                │
│  Mappers: Application → Presentation                     │
│  Type Guards, Validators                                 │
│  Scope: Server Actions, Client Components, Hooks         │
├─────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE (OOP)                    │
│  InfrastructureError (Class)                             │
│  InfrastructureResult<T, InfrastructureError> (Class)    │
│  Mappers: Application → Infrastructure                   │
│  Type Guards, Validators, Contracts                      │
│  Scope: DB queries, HTTP calls, cache, queue             │
├─────────────────────────────────────────────────────────┤
│                   APPLICATION (OOP)                      │
│  ApplicationError (Class)                                │
│  ApplicationResult<T, ApplicationError> (Class)          │
│  Mappers: Domain → Application                           │
│  Type Guards, Validators, Contracts                      │
│  Scope: UseCases, Handlers, DTOs, orchestration          │
├─────────────────────────────────────────────────────────┤
│                     DOMAIN (OOP)                         │
│  DomainError (Class)                                     │
│  DomainResult<T, DomainError> (Class)                    │
│  Type Guards, Validators, Contracts                      │
│  Scope: Entities, Aggregates, Value Objects, Business    │
├─────────────────────────────────────────────────────────┤
│               BASE (Abstract Layer)                      │
│  ErrorBase (Abstract Class)                              │
│  ResultBase<T, E> (Abstract Class)                       │
│  Type Guards, Validators                                 │
│  Scope: Shared contracts for all OOP layers              │
├─────────────────────────────────────────────────────────┤
│                   KERNEL (Capstone)                      │
│  Contracts: ErrorBase contract, ResultBase contract      │
│  Validator contracts: LayerValidator, ErrorValidator,    │
│                       ResultValidator                    │
│  Primitives: Severity, LayerType enums                   │
│  Branded types: CorrelationId, ErrorCode, OperationId    │
│  Constants: Error codes, Layer names                     │
│  Dependencies: ZERO (no other layers imported)           │
└─────────────────────────────────────────────────────────┘
```

**Critical insight:** The Kernel is a *capstone* layer for this system — it defines the types and contracts that foundations implement, but imports nothing from other layers. Every other layer depends on Kernel (directly or transitively). This inverts the typical "kernel at the bottom" mental model. The Kernel is at the *semantic top* but the *dependency bottom*.

### 1.2 Why This Structure Exists

| Concern | Solution |
|---------|----------|
| Business rules must never leak to UI | Domain errors carry zero technical details |
| Technical failures must never expose internals | Infrastructure errors sanitize before wrapping |
| Client must never see server internals | DUs at Presentation strip all classes/methods |
| Observability needs structured error data | Each layer enriches the error with context |
| TypeScript must enforce boundaries | Import rules + branded types + type guards |

---

## 2. Component Boundaries (What Lives Where)

### 2.1 Kernel Layer — Contracts, Primitives, Constants

**Purpose:** Define the vocabulary and shape contracts that all layers implement. Zero dependencies.

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `contracts/base/` | `ErrorBase.contract.ts` — interface contract for error shape | Implementation logic |
| `contracts/base/` | `ResultBase.contract.ts` — interface contract for result shape | Implementation logic |
| `contracts/validators/` | `LayerValidator.contract.ts` — contract for layer validation | Layer-specific validation logic |
| `contracts/validators/` | `ErrorValidator.contract.ts` — contract for error validation | Error-specific validation logic |
| `contracts/validators/` | `ResultValidator.contract.ts` — contract for result validation | Result-specific validation logic |
| `primitives/enums/` | `Severity` — Debug, Info, Warning, Error, Critical | Application logic |
| `primitives/enums/` | `LayerType` — Domain, Application, Infrastructure, Presentation | Application logic |
| `primitives/types/` | `CorrelationId` — branded `Opaque<string, 'CorrelationId'>` | Non-branded string usage |
| `primitives/types/` | `ErrorCode` — branded `Opaque<string, 'ErrorCode'>` | Non-branded string usage |
| `primitives/types/` | `OperationId` — branded `Opaque<string, 'OperationId'>` | Non-branded string usage |
| `constants/` | `ErrorCodes` — enumerated code constants | Layer-specific codes |
| `constants/` | `LayerNames` — layer name constants | Implementation details |

**Boundary rules:**
- Kernel imports NOTHING from Foundations, Modules, or external packages (zero external deps).
- Everything in Kernel is a `type`, `interface`, `const`, or `enum` — no classes, no runtime logic.
- All Kernel exports go through `src/core/kernel/index.ts` barrel.

### 2.2 Base Layer — Abstracts

**Purpose:** Shared abstract classes that provide the foundation for Domain, Application, and Infrastructure OOP implementations.

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `abstracts/` | `ErrorBase` — abstract class implementing ErrorBase contract | Concrete error types |
| `abstracts/` | `ResultBase<T, E>` — abstract class implementing ResultBase contract | Concrete result types |
| `validators/` | `BaseErrorValidator` — validation logic for error base | Layer-specific validation |
| `validators/` | `BaseResultValidator` — validation logic for result base | Layer-specific validation |
| `type-guards/` | `BaseErrorTypeGuard` — `isErrorBase()` runtime check | Layer-specific guards |
| `type-guards/` | `BaseResultTypeGuard` — `isResultBase()` runtime check | Layer-specific guards |

**Boundary rules:**
- Base imports from Kernel only.
- Base knows NOTHING about Domain, Application, Infrastructure, or Presentation.
- Base is the *last* place where shared OOP behavior exists.

**Key architectural decision:** These are abstract classes (not interfaces/interfaces) because:
1. They share `toJSON()` serialization logic that all layers need.
2. They define the monad method signatures (`map`, `flatMap`, `match`, `fold`).
3. instanceof checks work across the layer hierarchy.

### 2.3 Domain Layer — OOP (Pure Business Logic)

**Purpose:** Represent business rule violations and domain operation results. Purest layer — zero framework/technology coupling.

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `errors/domain-error.ts` | `DomainError` class extending ErrorBase | Technical details (stack traces, DB connections) |
| `errors/domain-error.contract.ts` | Interface for DomainError shape | Implementation |
| `errors/domain-error.validator.ts` | Validation logic | Cross-layer imports |
| `errors/domain-error.type-guard.ts` | `isDomainError()` | Non-domain types |
| `errors/specific/` | Concrete domain errors per module | Cross-module references |
| `results/domain-result.ts` | `DomainResult<T>` class extending `ResultBase<T, DomainError>` | External concerns |
| `results/domain-result.contract.ts` | Interface | Implementation |
| `results/domain-result.validator.ts` | Validation | Cross-layer imports |
| `results/domain-result.type-guard.ts` | `isDomainResult()` | Non-domain types |

**Boundary rules:**
- Domain imports: ONLY Kernel + Base + Domain (same layer). No Application, Infrastructure, Presentation ever.
- Domain errors carry business context (`businessRule`, `aggregateId`) but ZERO technical details.
- Domain Results support method chaining: `result.map().validate().persist()`.
- Domain layer is the *source of truth* for business invariants.

### 2.4 Application Layer — OOP (Orchestration)

**Purpose:** Coordinate use cases, compose domain operations, add cross-cutting context (user, correlation, audit).

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `errors/` | `ApplicationError` class — wraps DomainError + adds operation context | Infrastructure details |
| `errors/specific/` | Use-case errors (e.g., `CreateOrderFailedError`) | Business rules (delegates to Domain) |
| `results/` | `ApplicationResult<T>` — adds `log()`, `metrics()`, `audit()`, `trackExecution()` | Domain business logic |
| `mappers/` | `DomainToApplicationErrorMapper` — wraps DomainError with context | Domain logic |

**Boundary rules:**
- Application imports: Kernel + Base + Domain. NOT Infrastructure or Presentation.
- ApplicationError wraps DomainError via `cause` chain — never replaces it.
- Application layer owns `correlationId` propagation across use cases.
- Every `ApplicationResult` carries auditing metadata.

### 2.5 Infrastructure Layer — OOP (Technical)

**Purpose:** Handle all I/O, external services, databases, caching. The "dirty" layer.

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `errors/` | `InfrastructureError` class — technical failure with safe details | Business rules |
| `errors/specific/` | DB, network, cache errors | Business domain concepts |
| `results/` | `InfrastructureResult<T>` — adds `retry()`, `withTimeout()`, `withCircuitBreaker()`, `withFallback()` | Business logic |
| `mappers/` | `ApplicationToInfrastructureErrorMapper` | Domain logic |

**Boundary rules:**
- Infrastructure imports: Kernel + Base + Domain + Application. NOT Presentation.
- Infrastructure errors MUST sanitize all internals via `sanitizeForPresentation()` before wrapping.
- `safeDetails` is the ONLY error payload that survives to upper layers.
- Infrastructure owns circuit breaking, retry strategies, and timeouts.

### 2.6 Presentation Layer — Discriminated Unions

**Purpose:** The serialization-safe boundary. Plain objects only — no classes, no methods.

| Component | Contents | What It MUST NOT Contain |
|-----------|----------|--------------------------|
| `errors/presentation-error.ts` | Discriminated Union type — 5 variants | Classes, methods, stack traces |
| `results/presentation-result.ts` | Discriminated Union type — Success | Failure variants | Classes, methods |
| `mappers/` | `ApplicationToPresentationErrorMapper` | Business logic |
| `mappers/` | `ApplicationToPresentationResultMapper` | Business logic |
| `specific/` | UI-specific error variants (field errors, network errors, system errors) | Server-only types |

**Boundary rules:**
- Presentation imports: Application layer only (to map from ApplicationResult/Error to DUs).
- Presentation NEVER imports Domain or Infrastructure directly.
- Presentation NEVER contains classes, methods, or functions with behavior.
- Presentation types must be 100% JSON-serializable (plain objects, strings, numbers, booleans).
- All mapping happens IN the Presentation layer, at the boundary.

---

## 3. Strict Import Boundaries (Dependency Direction)

```
                    ┌──────────────────┐
                    │   Presentation   │  (DU - plain objects only)
                    │    (Server +     │
                    │     Client)      │
                    └────────┬─────────┘
                             │ imports from Application ONLY
                    ┌────────▼─────────┐
                    │   Application    │  (OOP - orchestration)
                    │   (Server only)  │
                    └────────┬─────────┘
                             │ imports from Domain
                    ┌────────▼─────────┐
                    │     Domain       │  (OOP - pure business)
                    │   (Server only)  │
                    └────────┬─────────┘
                             │ imports from Kernel + Base
                    ┌────────▼─────────┐
                    │      Base        │  (Abstract OOP)
                    │   (Server only)  │
                    └────────┬─────────┘
                             │ imports from Kernel ONLY
                    ┌────────▼─────────┐
                    │     Kernel       │  (Types, enums, constants)
                    │      (All)       │
                    └──────────────────┘
                         ZERO IMPORTS
```

**And separately:**

```
                    ┌──────────────────┐
                    │  Infrastructure  │  (OOP - I/O, DB, network)
                    │   (Server only)  │
                    └──────────────────┘
                         imports from Domain + Application
                         (Infrastructure is a "peer" to Application,
                          not below it — both depend on Domain)
```

### 3.1 Enforcement Mechanisms

| Mechanism | How It Works | Where |
|-----------|-------------|-------|
| **TypeScript strict imports** | `noImplicitAny`, `strictNullChecks` catch misuses | `tsconfig.json` |
| **ESLint import rules** | `import/no-restricted-paths` blocks upward imports | Future ESLint config |
| **Barrel exports** | Each layer's `index.ts` controls what's public | All layers |
| **Branded types** | `CorrelationId` cannot be passed where `ErrorCode` is expected | Kernel/primitives |
| **Layer type guards** | `isDomainError()` prevents passing non-domain errors | Each layer |

### 3.2 Import Violation Examples

```typescript
// ❌ VIOLATION: Presentation imports Domain directly
import { DomainError } from '@/core/foundations/domain';
// → MUST go through Application mappers

// ❌ VIOLATION: Application imports Infrastructure
import { InfrastructureError } from '@/core/foundations/infrastructure';
// → Application orchestrates but doesn't call infrastructure directly

// ❌ VIOLATION: Domain imports Application
import { ApplicationResult } from '@/core/foundations/application';
// → Domain knows nothing about use cases

// ✅ CORRECT: Presentation imports Application mappers
import { mapToPresentationError } from '@/core/foundations/presentation/mappers';

// ✅ CORRECT: Application imports Domain
import { DomainError } from '@/core/foundations/domain';

// ✅ CORRECT: Infrastructure imports Domain
import { DomainResult } from '@/core/foundations/domain';
```

---

## 4. Data Flow

### 4.1 Request → Response Flow (Happy Path)

```
[Client Component]
    │
    │  User submits form
    ▼
[Server Action]  ─── Presentation layer (DU)
    │
    │  ApplicationToPresentationMapper converts
    │  ApplicationResult → PresentationResult
    ▼
[Command Handler]  ─── Application layer (OOP)
    │
    │  DomainToApplicationMapper converts
    │  DomainResult → ApplicationResult
    │  (adds userId, correlationId, operationId)
    ▼
[Domain Service]  ─── Domain layer (OOP)
    │
    │  Operates on entities, checks invariants
    │  Returns DomainResult<Entity>
    ▼
[Repository]  ─── Infrastructure layer (OOP)
    │
    │  Executes DB query via Drizzle
    │  Returns InfrastructureResult<RawData>
    ▼
[Database] (PostgreSQL via Drizzle ORM)
    │
    │  Returns data or throws
    ▼
Back through the chain (reverse direction)
```

### 4.2 Error Propagation Flow (Failure Path)

```
InfrastructureError
    │  (DB connection failure, timeout)
    │  Properties: technicalCause, systemComponent, safeDetails, retryStrategy
    ▼
    └──▶ Caught by Repository, wrapped:
         InfrastructureError (with cause chain preserved)
         ↓
         Repository returns InfrastructureResult<never, InfrastructureError>

ApplicationError
    │  (Operation failed, orchestrates retry/fallback)
    │  Properties: operationName, userId, correlationId, retryable
    │  Wraps: cause = domainError OR infrastructureError
    ▼
    └──▶ Created by ApplicationToDomainMapper or ApplicationErrorMapper
         ↓
         UseCase returns ApplicationResult<never, ApplicationError>

PresentationError
    │  (Safe user-facing message, NO internals)
    │  Properties: _tag, userMessage, errorCode, severity
    │  NEVER carries: stack traces, DB info, business rules
    ▼
    └──▶ Created by ApplicationToPresentationErrorMapper in Server Action
         ↓
         Server Action returns PresentationResult<never>
```

### 4.3 The Critical Transformation Point

The most architecturally significant conversion happens at the **Application → Presentation** boundary in Server Actions:

```
ApplicationResult<DTO>       ← OOP class (has methods, behavior)
    │
    │  [Server Action Boundary]
    ▼
PresentationResult<SafeDTO>  ← Discriminated Union (plain object)
```

This conversion:
1. **Strips all methods** — the DU has no behavior, only data
2. **Translates errors** — ApplicationError → user-friendly PresentationError
3. **Sanitizes payloads** — removes internal-only fields
4. **Adds metadata** — operationId, duration, timestamp
5. **Crosses the network** — the DU is 100% JSON-serializable

```typescript
// Server Action (the boundary)
export async function createOrder(formData: FormData): Promise<PresentationResult<OrderDTO>> {
  // 1. Parse input
  const command = parseCreateOrderCommand(formData);

  // 2. Execute use case (returns OOP ApplicationResult)
  const appResult: ApplicationResult<OrderDTO> = await createOrderUseCase.execute(command);

  // 3. CRITICAL: Map to Presentation DU at the boundary
  return appResult.match({
    onSuccess: (data) => mapToPresentationSuccess(data),
    onFailure: (error) => mapToPresentationError(error),
  });
}
```

**Why this matters for Next.js RSC:**
- The RSC payload serializes props passed from Server Components to Client Components.
- Class instances lose their methods during serialization → `result.isOk()` becomes `undefined is not a function` at runtime.
- Discriminated Unions survive serialization → `result._tag === 'Success'` works after deserialization.
- This is not optional — it is enforced by Next.js/React RSC constraints.

### 4.4 Observable Flow

Every error/result carries observability data that survives the chain:

```
[Domain]     timestamp, correlationId (inherited)
[Application]  +userId, +operationId, +auditData
[Infrastructure]  +systemComponent, +retryCount
[Presentation]   +duration, +userMessage
```

The `cause` chain enables full tracing:
```
PresentationError
  └── cause: ApplicationError (wrapped)
        └── cause: DomainError (origin)
              └── cause: InfrastructureError (technical root)
```

---

## 5. Serialization Boundary (The DU Imperative)

### 5.1 Why Classes Can't Cross Server Action → Client

Next.js/React RSC serialization uses `JSON.stringify()`-like protocol:

```
Class instance:
  { name: 'DomainError', message: '...', isRecoverable: function() {...} }
                    ↓ AFTER SERIALIZATION ↓
  { name: 'DomainError', message: '...' }
  // ⚠️ isRecoverable() is GONE — runtime crash if called
```

Discriminated Union:
```
TypeScript type (compiled away):
  { _tag: 'NotFoundError', userMessage: 'Order not found' }
                    ↓ AFTER SERIALIZATION ↓
  { _tag: 'NotFoundError', userMessage: 'Order not found' }
  // ✅ All data preserved — no methods to lose
```

### 5.2 The PresentationError Discriminated Union

```typescript
type PresentationError =
  | { _tag: 'ValidationError'; fieldErrors: Record<string, string>; userMessage: string }
  | { _tag: 'NotFoundError'; userMessage: string; suggestedAction?: string }
  | { _tag: 'AuthorizationError'; userMessage: string; requiredPermission?: string }
  | { _tag: 'SystemError'; userMessage: string; errorCode: string; severity: 'warning' | 'error' | 'critical' }
  | { _tag: 'NetworkError'; userMessage: string; retryable: boolean };
```

**Rules:**
- All variants use `_tag` as discriminant (standard TypeScript pattern).
- All properties are `string`, `number`, `boolean`, or plain objects — no `Date`, no `Map`, no `Set`, no functions.
- `userMessage` is the ONLY message exposed to clients — no technical details.
- `_tag` enables exhaustive `switch`/`match` on the client.

### 5.3 The PresentationResult Discriminated Union

```typescript
type PresentationResult<T> =
  | { _tag: 'Success'; data: T; metadata?: { operationId: string; duration: number; timestamp: string } }
  | { _tag: 'Failure'; error: PresentationError; metadata?: { operationId: string; timestamp: string; retryAfter?: number } };
```

### 5.4 Client-Side Pattern Matching

```typescript
// Client Component
function OrderStatus({ result }: { result: PresentationResult<OrderDTO> }) {
  switch (result._tag) {
    case 'Success':
      return <div>Order #{result.data.id} created</div>;
    case 'Failure':
      switch (result.error._tag) {
        case 'ValidationError':
          return <FormErrors errors={result.error.fieldErrors} />;
        case 'AuthorizationError':
          return <AccessDenied />;
        case 'SystemError':
          return <ErrorBanner message={result.error.userMessage} />;
        default:
          return exhaustive(result.error);
      }
  }
}
```

---

## 6. Mapper Pattern (Cross-Layer Transformation)

### 6.1 Mapping Architecture

There are exactly **three** mappings in the system:

| Mapping | Direction | When | What It Does |
|---------|-----------|------|--------------|
| Domain → Application | Upward | Between Domain Service and UseCase | Wraps DomainError → ApplicationError, adds context |
| Application → Infrastructure | Downward | Between UseCase and Repository | Translates operation context → technical context |
| Application → Presentation | Boundary | In Server Action | ApplicationResult → PresentationResult DU |

### 6.2 The Mapper Contract

```typescript
// Generic mapper interface (defined in Kernel)
interface LayerMapper<TSource, TTarget, TContext> {
  map(source: TSource, context: TContext): TTarget;
  mapSafe(source: TSource, context: TContext): Result<TTarget, MappingError>;
}
```

### 6.3 Example: Domain → Application Error Mapper

```typescript
class DomainToApplicationErrorMapper
  implements LayerMapper<DomainError, ApplicationError, { userId: string; correlationId: CorrelationId; operationName: string }>
{
  map(domainError: DomainError, context: { userId: string; correlationId: CorrelationId; operationName: string }): ApplicationError {
    return new ApplicationError({
      operationName: context.operationName,
      userId: context.userId,
      correlationId: context.correlationId,
      cause: domainError,        // ← preserve cause chain
      retryable: domainError.isRecoverable(),
    });
  }
}
```

### 6.4 Example: Application → Presentation Error Mapper

```typescript
class ApplicationToPresentationErrorMapper
  implements LayerMapper<ApplicationError, PresentationError, { locale?: string }>
{
  map(appError: ApplicationError, context?: { locale?: string }): PresentationError {
    // 1. Sanitize: strip all internal details
    // 2. Translate: technical → user message
    // 3. Map to correct DU variant based on appError type
    if (appError instanceof AuthorizationFailedError) {
      return {
        _tag: 'AuthorizationError',
        userMessage: this.translate('unauthorized', context?.locale),
        requiredPermission: appError.requiredPermission,
      };
    }
    // ... other mappings
  }
}
```

---

## 7. Build Order (Dependency-Driven Implementation Sequence)

### 7.1 Layer Dependency Graph

```
Kernel (no deps) ───┐
                     │
Base (depends on Kernel) ───┐
                             │
Domain (depends on Kernel + Base) ───┐
                                      │
Application (depends on Kernel + Base + Domain) ───┐
                                                    │
Infrastructure (depends on Kernel + Base + Domain + Application)
                                                    │
Presentation (depends on Application only)
```

### 7.2 Recommended Build Order

| Phase | Layer | Components | Depends On |
|-------|-------|------------|------------|
| **1** | **Kernel** | Primitives → Contracts → Constants → Barrel | Nothing |
| **2** | **Base** | Abstracts → Validators → Type Guards → Barrel | Kernel |
| **3** | **Domain** | DomainError → DomainResult → Contracts → Validators → Type Guards → Barrel | Kernel, Base |
| **4** | **Application** | ApplicationError → Domain→App Mapper → ApplicationResult → Contracts → Validators → Type Guards → Barrel | Kernel, Base, Domain |
| **5** | **Infrastructure** | InfrastructureError → Application→Infra Mapper → InfrastructureResult → Contracts → Validators → Type Guards → Barrel | Kernel, Base, Domain, Application |
| **6** | **Presentation** | PresentationError → PresentationResult → App→Pres Mappers → Validators → Type Guards → Barrel | Application |

### 7.3 Internal Build Order Within Each Layer

Each layer follows the same internal sequence:

```
1. Error class        ← Can exist independently
2. Error contract     ← Documents error shape (interface)
3. Error validator    ← Validates error instances
4. Error type guard   ← Runtime type checking
5. Result class       ← Depends on error class
6. Result contract    ← Documents result shape
7. Result validator   ← Validates result instances
8. Result type guard  ← Runtime type checking
9. Mappers            ← Only for Application, Infrastructure, Presentation
10. Barrel export     ← Layer public API
```

### 7.4 Module-Level Implementation Order

Within each layer, file-level implementation sequence:

```
1. Base error class            → Layer-level error (e.g., DomainError)
2. Specific error classes      → Module-level errors (e.g., OrderNotFoundError)
3. Base result class           → Layer-level result (e.g., DomainResult)
4. Contracts (interfaces)      → Type contracts
5. Validators                  → Validation logic
6. Type guards                 → Runtime type checking
7. Mappers                     → Cross-layer conversion (where applicable)
8. Barrel exports              → Public API
```

---

## 8. The Monad Chain (Result Composability)

### 8.1 Monad Operations Per Layer

Each Result class (Domain, Application, Infrastructure) implements the same monad interface:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `map` | `<U>(fn: (data: T) => U): Result<U, E>` | Transform success value |
| `flatMap` | `<U>(fn: (data: T) => Result<U, E>): Result<U, E>` | Chain operations that may fail |
| `mapError` | `<F>(fn: (error: E) => F): Result<T, F>` | Transform error value |
| `match` | `<R>(handlers: { onSuccess, onFailure }): R` | Pattern match both cases |
| `fold` | `<R>(onSuccess, onFailure): R` | Unwrap both cases |
| `tap` | `(fn: (data: T) => void): Result<T, E>` | Side effect on success |
| `tapError` | `(fn: (error: E) => void): Result<T, E>` | Side effect on failure |

### 8.2 Layer-Specific Extensions

```typescript
// DomainResult adds:
  map(): DomainResult<T>     // standard monad
  validate(predicate): DomainResult<T>  // business validation in chain
  persist(repo): DomainResult<T>        // persistence in chain

// ApplicationResult adds:
  log(): ApplicationResult<T>           // structured logging
  metrics(): ApplicationResult<T>       // performance metrics
  audit(): ApplicationResult<T>         // audit trail
  trackExecution(): ApplicationResult<T> // execution timing

// InfrastructureResult adds:
  retry(times, delay): InfrastructureResult<T>           // retry on failure
  withTimeout(ms): InfrastructureResult<T>               // timeout
  withCircuitBreaker(): InfrastructureResult<T>           // circuit breaker
  withFallback(fn): InfrastructureResult<T>               // fallback value
```

### 8.3 Composition Example (Railway Pattern)

```typescript
// Railway-oriented programming through the layers
const result = await someWorkflow()
  .map(validateInput)
  .flatMap(processDomain)
                                  // DomainResult → Domain→App mapper
  .flatMap(domainResult => mapToApplicationResult(domainResult, context))
                                  // Application layer
  .tap(appResult => auditLogger.log(appResult))
  .flatMap(appResult => persistToDatabase(appResult))
                                  // Application→Infra mapper + Infra
  .retry(3, 100)
  .withTimeout(5000)
  .match({
    onSuccess: (data) => mapToPresentationSuccess(data),
    onFailure: (error) => mapToPresentationError(error),
  });
// result is now PresentationResult<DTO> — safe for RSC serialization
```

---

## 9. Type Guard Architecture

### 9.1 Guard Types

Each layer defines exactly two type guards:

```typescript
// Domain
isDomainError(error: unknown): error is DomainError
isDomainResult<T>(result: unknown): result is DomainResult<T>

// Application
isApplicationError(error: unknown): error is ApplicationError
isApplicationResult<T>(result: unknown): result is ApplicationResult<T>

// Infrastructure
isInfrastructureError(error: unknown): error is InfrastructureError
isInfrastructureResult<T>(result: unknown): result is InfrastructureResult<T>

// Presentation
isPresentationError(error: unknown): error is PresentationError
isPresentationResult<T>(result: unknown): result is PresentationResult<T>

// Base (shared)
isErrorBase(error: unknown): error is ErrorBase
isResultBase(result: unknown): result is ResultBase<unknown, ErrorBase>
```

### 9.2 Guard Implementation Pattern

```typescript
// Example: DomainError type guard
function isDomainError(error: unknown): error is DomainError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'layer' in error &&
    error.layer === LayerType.DOMAIN &&
    'businessRule' in error &&
    error instanceof DomainError  // ← final check
  );
}
```

---

## 10. Validator Architecture

### 10.1 Validation Tiers

| Validator | What It Validates | When |
|-----------|-------------------|------|
| `LayerValidator` | A value belongs to the correct layer (runtime check) | Layer boundary crossing |
| `ErrorValidator` | Error instance satisfies layer contract | Construction + deserialization |
| `ResultValidator` | Result instance satisfies layer contract | Construction + deserialization |

### 10.2 Layer-Specific Validation

```typescript
// DomainErrorValidator
class DomainErrorValidator implements ErrorValidator<DomainError> {
  validate(error: unknown): Result<DomainError, ValidationError> {
    // 1. Is it an object?
    // 2. Does it have required DomainError properties?
    // 3. Is layer = LayerType.DOMAIN?
    // 4. Does isRecoverable() return boolean?
    // 5. Does getSeverity() return Severity?
  }
}
```

---

## 11. Anti-Patterns to Avoid

### 11.1 Error Anemia (Empty Error Classes)

```typescript
// ❌ BAD: Error class adds nothing over the base
class OrderError extends DomainError {
  // No additional properties or behavior
  // Just a different name — useless
}

// ✅ GOOD: Error class enriches with domain context
class InsufficientStockError extends DomainError {
  constructor(
    readonly productId: string,
    readonly requestedQuantity: number,
    readonly availableQuantity: number,
  ) {
    super({
      code: ErrorCodes.INSUFFICIENT_STOCK,
      message: `Insufficient stock for product ${productId}`,
      layer: LayerType.DOMAIN,
      cause: undefined,
    });
  }

  isRecoverable(): boolean { return true; }  // Can retry after restock
  getSeverity(): Severity { return Severity.WARNING; }
}
```

### 11.2 Layer Leakage

```typescript
// ❌ BAD: Server Action directly handles DomainError
export async function action(): Promise<PresentationResult<DTO>> {
  const result = domainService.execute(); // Returns DomainResult<Entity>
  if (result.isFailure && result.error instanceof InsufficientStockError) {
    // ⚠️ Domain error leaking into Server Action!
    // Must be mapped through Application layer first
  }
}

// ✅ GOOD: Application layer handles Domain errors
export async function action(): Promise<PresentationResult<DTO>> {
  const useCase = container.resolve(CreateOrderUseCase);
  const result = await useCase.execute(command);
  return mapToPresentationResult(result);
}
```

### 11.3 Catching DomainError in Infrastructure

```typescript
// ❌ BAD: Infrastructure catches DomainError
try {
  domainService.execute();
} catch (e) {
  if (e instanceof DomainError) {
    // ⚠️ Infrastructure should never know about DomainError
    // Infrastructure errors are technical, not business
  }
}

// ✅ Infrastructure only handles its own errors
try {
  db.query(...);
} catch (e) {
  if (e instanceof DatabaseConnectionError) {
    return InfrastructureResult.fail(e);
  }
}
```

### 11.4 Using Classes in Presentation

```typescript
// ❌ BAD: Class at the serialization boundary
class PresentationError { ... }
// → RSC serialization strips methods → breaks client

// ✅ Discriminated Union survives serialization
type PresentationError =
  | { _tag: 'NotFoundError'; userMessage: string };
```

---

## 12. Scalability Considerations

| Concern | At Module Scale (1-5 modules) | At Feature Scale (5-20 modules) | At Product Scale (20+ modules) |
|---------|------------------------------|--------------------------------|--------------------------------|
| **Error taxonomy** | Centralized error code list | Per-module error codes + central registry | Auto-generated error code documentation |
| **Mapping** | Manual mappers per use case | Shared mapping utilities + conventions | Code-generated mappers from contracts |
| **Observability** | Console.log in `tap` | Structured logging service | Distributed tracing + monitoring integration |
| **Validator cost** | Runtime validation on construction | Selective validation at boundaries | Compile-time validation + runtime boundary checks |
| **Bundle size (Presentation)** | ~2KB (trivial) | ~10KB (still fine) | ~30KB — tree-shake unused DU variants |
| **Type guard cost** | `instanceof` checks | Layer-linked guards with caching | Optimized branded type checks |
| **Layer violation detection** | Manual code review | ESLint rules + pre-commit hooks | Automated architecture tests |

---

## 13. Key Architectural Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| **OOP for inner layers** | Polymorphism, DI, encapsulation — matches Architecture.md spec | Pure functions + DUs everywhere (rejected: no DI, no behavior encapsulation) |
| **DU for Presentation** | RSC serialization safety — plain objects survive `JSON.stringify` | Classes with `toJSON()` (rejected: methods still lost, confusing API) |
| **Kernel as capstone, not foundation** | Kernel types used by everything but depends on nothing — cleaner isolation | Traditional "utils at bottom" (rejected: Kernel is semantically richer than utilities) |
| **Branded types for IDs** | Compile-time prevention of ID confusion | Raw strings (rejected: `ErrorCode` passed where `CorrelationId` expected) |
| **Explicit mappers, not automatic** | Clear boundaries, visible transformations, auditable | Auto-mapping via `class-transformer` (rejected: magic behavior, runtime coupling) |
| **Layer-specific Error/Result classes** | Each layer owns its error vocabulary, prevents type mixing | Single `Result<T,E>` with tags (rejected: loses layer-specific behavior) |
| **Cause chain preservation** | Full error traceability across layers | Error flattening (rejected: loses origin context) |
| **Abstract Base classes** | Shared `toJSON()`, type guards, and monad signatures | Interfaces + standalone utilities (rejected: instanceof checks needed for type guards) |

---

## 14. Sources

- **Primary**: `docs/Base_System.md` — Complete error/result system specification (HIGH confidence)
- **Primary**: `docs/Architecture.md` — Hybrid OOP + DU architecture specification (HIGH confidence)
- **Primary**: `.planning/PROJECT.md` — Phase definitions and constraints (HIGH confidence)
- **Ecosystem**: `neverthrow` Result pattern — Validates monad method design (MEDIUM confidence — used as reference)
- **Ecosystem**: Effect.ts layered error handling — Validates cause chain architecture (MEDIUM confidence — more complex than needed here)
- **Next.js RSC**: Next.js 16 documentation — Validates serialization constraints for DUs (HIGH confidence)
- **TypeScript**: Branded types + discriminated unions — Standard TypeScript patterns (HIGH confidence)
