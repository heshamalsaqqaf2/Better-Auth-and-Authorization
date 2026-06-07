<!-- refreshed: 2026-06-07 -->
# Architecture

**Analysis Date:** 2026-06-07

## System Overview

The project uses a **Hybrid Architecture** combining Clean Architecture, Domain-Driven Design (DDD), CQRS, and SOLID principles. Inner layers (Domain, Application, Infrastructure) use OOP Classes; the outer Presentation layer uses Discriminated Unions (DUs) for safe RSC serialization across the network boundary.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                      Next.js 16 App Layer                             │
│  `src/app/`  Route Groups: (admin)/dashboard, (user)/dashboard        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Presentation Layer (Discriminated Unions — Plain Objects)    │    │
│  │  `src/Core/Foundations/Presentation/`                         │    │
│  │  - PresentationError / PresentationResult (DU types)          │    │
│  │  - Application-to-Presentation mappers                        │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐    │
│  │  Application Layer (OOP Classes)                              │    │
│  │  `src/Core/Foundations/Application/`                          │    │
│  │  - UseCases, DTOs, ApplicationResult, ApplicationError        │    │
│  │  `src/Modules/*/Application/UseCases/{Queries,Commands}/`     │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐    │
│  │  Domain Layer (OOP Classes)                                   │    │
│  │  `src/Core/Foundations/Domain/`                               │    │
│  │  - DomainResult, DomainError, Domain Entities, Repositories   │    │
│  │  `src/Modules/*/Domain/Repositories/{Queries,Commands}/`      │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐    │
│  │  Infrastructure Layer (OOP Classes)                           │    │
│  │  `src/Core/Foundations/Infrastructure/`                       │    │
│  │  - Repositories, DB Mappers, External Clients                 │    │
│  │  `src/Modules/*/Infrastructure/` — DB schema, Relations       │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐    │
│  │  Lib (3rd-party integrations)                                  │    │
│  │  `src/Lib/Drizzle/` — DB client, connection pool, migrations  │    │
│  │  `src/Lib/BetterAuth/` — Auth config (server + client)        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Shared Layer (cross-module utilities)                        │    │
│  │  `src/Shared/` — Components (ui, providers, customs,          │    │
│  │  layouts), hooks, utils, actions                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Composition Root (DI Container)                              │    │
│  │  `src/CompositionRoot/` — Bindings, Containers, container.ts  │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  External Systems                                                     │
│  - PostgreSQL Database (via `pg` pool + Drizzle ORM)                  │
│  - Better Auth (email/password, OAuth, session management)            │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | HTML shell with fonts, providers, globals CSS | `src/app/layout.tsx` |
| Provider | NextTopLoader, Toaster (sonner), TooltipProvider | `src/Shared/components/providers/provider.tsx` |
| Drizzle Client | Singleton DB connection pool, health check, shutdown | `src/Lib/Drizzle/Config/drizzle.client.ts` |
| Connection Pool Config | Pool sizing by environment (dev/prod) | `src/Lib/Drizzle/Database/connection.pool.ts` |
| Drizzle Config (CLI) | Drizzle Kit configuration for migrations | `src/Lib/Drizzle/Config/drizzle.config.ts` |
| Schema Aggregator | Combines all module schemas into one object | `src/Lib/Drizzle/Database/Schema/index.ts` |
| User Schema | User table definition (id, name, email, etc.) | `src/Modules/Authentication/Infrastructure/Database/Schema/user.schema.ts` |
| Session Schema | Session table definition (expiresAt, token, userId) | `src/Modules/Authentication/Infrastructure/Database/Schema/session.schema.ts` |
| Account Schema | Account/OAuth provider link table | `src/Modules/Authentication/Infrastructure/Database/Schema/account.schema.ts` |
| Verification Schema | Email verification codes | `src/Modules/Authentication/Infrastructure/Database/Schema/verification.schema.ts` |
| Relations | Drizzle relations between user/session/account | `src/Modules/Authentication/Infrastructure/Database/Relations/relations.ts` |
| Error Base (Contract) | Core interface for all layered errors | `src/Core/Kernel/Contracts/Base/error-base.contract.ts` |
| Result Base (Contract) | Core interface for all layered results | `src/Core/Kernel/Contracts/Base/result-base.contract.ts` |
| Layer Validator | Validates layer isolation rules | `src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts` |
| Layer Type Enum | Enum of layer types (domain, app, infra, presentation) | `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` |

## Pattern Overview

**Overall:** Hybrid Clean Architecture + DDD + CQRS

**Key Characteristics:**
- **OOP for inner layers** (Domain, Application, Infrastructure) — Classes, polymorphism, encapsulation
- **Discriminated Unions for Presentation** — Plain objects with `_tag` discriminant for safe RSC serialization
- **Layered Error/Result System** — Each layer has its own typed Error and Result hierarchy (ErrorBase -> DomainError -> ApplicationError -> InfrastructureError -> PresentationError)
- **Explicit Cross-Layer Mapping** — No implicit conversion; mappers at each boundary (e.g., `domain-to-application-error.mapper.ts`, `application-to-presentation-result.mapper.ts`)
- **Module Isolation** — Each feature module (currently only Authentication) has its own Domain/Application/Infrastructure/Presentation
- **Composition Root** — DI container for dependency injection
- **CQRS** — Separated Command and Query interfaces at UseCase and Repository levels

## Layers

**Kernel Layer:**
- Purpose: Central, framework-agnostic primitives that all layers depend on
- Location: `src/Core/Kernel/`
- Contains: Contracts (error-base, result-base, validators), Primitives (Enums: Severity, LayerType; Types: CorrelationId, ErrorCode, OperationId), Constants (error codes, layer names)
- Depends on: Nothing (zero external dependencies)
- Used by: All layers

**Base Layer:**
- Purpose: Abstract base classes for the Error/Result system
- Location: `src/Core/Foundations/Base/`
- Contains: `error-base.ts` (abstract class), `result-base.ts` (abstract class), TypeGuards, Validators
- Depends on: Kernel layer only
- Used by: Domain, Application, Infrastructure, Presentation layers

**Domain Layer:**
- Purpose: Business logic, domain entities, invariants, repository interfaces
- Location: `src/Core/Foundations/Domain/` + `src/Modules/*/Domain/`
- Contains: `DomainResult<T>` (OOP monad), `DomainError` (business rule violations), specific domain errors (UserErrors, ComplaintErrors), repository query/command interfaces
- Depends on: Kernel + Base only (no framework dependencies)
- Used by: Application layer

**Application Layer:**
- Purpose: Use cases, orchestration, DTOs, command/query handlers
- Location: `src/Core/Foundations/Application/` + `src/Modules/*/Application/`
- Contains: `ApplicationResult<T>` (with logging, metrics, audit), `ApplicationError` (operation failures, validation, authorization), mappers from Domain
- Depends on: Domain + Kernel + Base
- Used by: Presentation layer (via Server Actions)

**Infrastructure Layer:**
- Purpose: Database schemas, repository implementations, external clients
- Location: `src/Core/Foundations/Infrastructure/` + `src/Modules/*/Infrastructure/` + `src/Lib/`
- Contains: `InfrastructureResult<T>` (with retry, timeout, circuit-breaker), `InfrastructureError` (DB errors, network errors, cache errors), Drizzle table schemas, connection pool, mappers
- Depends on: Application + Domain + Kernel + Base + external libs
- Used by: Application layer

**Presentation Layer:**
- Purpose: Server Actions, UI state, serialization-safe data types
- Location: `src/Core/Foundations/Presentation/`
- Contains: `PresentationResult<T>` (Discriminated Union with `_tag: 'Success' | 'Failure'`), `PresentationError` (DU: ValidationError, NotFoundError, AuthorizationError, SystemError, NetworkError), mappers from Application
- Depends on: Application + Kernel only
- Used by: Next.js App Router pages and components

## Data Flow

### Primary Request Path (Server Action → Client)

1. **Client Component** triggers action (e.g., form submit)
2. **Server Action** (`src/Modules/*/Presentation/`) receives form data, creates Command/Query
3. **UseCase Handler** (`src/Modules/*/Application/UseCases/Commands/` or `Queries/`) orchestrates business logic
4. **Domain Service** (`src/Modules/*/Domain/`) validates business rules, returns `DomainResult<Entity>`
5. **Repository** (`src/Modules/*/Infrastructure/Repositories/`) persists/retrieves data via Drizzle
6. **Infrastructure layer** returns `InfrastructureResult<RawData>`
7. **Mapper chain**: InfrastructureResult → (DomainResult) → ApplicationResult → PresentationResult
8. **Server Action** returns `PresentationResult<T>` (Discriminated Union — plain object)
9. **Client Component** pattern-matches on `result._tag === 'Success'` or `'Failure'`

### Authentication Flow (Better Auth)

1. User visits sign-in page
2. Better Auth client (`src/Lib/BetterAuth/Config/client.ts`) initiates auth request
3. Better Auth server handler (`src/Lib/BetterAuth/Config/server.ts`) validates credentials
4. Session token stored in cookie cache (configurable: compact/JWT/JWE)
5. Session management via Better Auth (7-day expiry, sliding window refresh)
6. Session data accessible via `getSession()` utility (`src/Lib/BetterAuth/utils/get-session.ts`)

**State Management:**
- Server state: Better Auth manages sessions in DB or secondary storage (Redis/KV)
- Client state: React hooks (Better Auth React client), `@tanstack/react-store` for local state
- Form state: `@tanstack/react-form` for forms
- Theme: `next-themes` (declared but not fully wired)

## Key Abstractions

**Error/Result Hierarchy:**
- Purpose: Typed error and result monads at each architectural layer with explicit cross-layer mapping
- Files: `src/Core/Foundations/{Base,Domain,Application,Infrastructure,Presentation}/`
- Pattern: Abstract base classes → Concrete typed classes → Discriminated Unions at boundary

**Layered Error Types (per `docs/Base_System.md`):**
- `ErrorBase` — abstract: `code`, `message`, `timestamp`, `layer`, `cause`
- `DomainError` — OOP: `businessRule`, `aggregateId`, `severity`, `recoverable`
- `ApplicationError` — OOP: `operationName`, `userId`, `correlationId`, `wrappedDomainError`, `retryable`
- `InfrastructureError` — OOP: `technicalCause`, `retryCount`, `systemComponent`, `safeDetails`, `retryStrategy`
- `PresentationError` — DU: `{ _tag, userMessage, ... }` (fieldErrors, suggestedAction, errorCode, retryable)

**Layered Result Types:**
- `ResultBase<T, E>` — abstract monad: `isSuccess`, `isFailure`, `data`, `error`, `map`, `flatMap`, `match`, `fold`, `tap`
- `DomainResult<T>` — Monad with method chaining
- `ApplicationResult<T>` — Monad with logging/metrics/audit
- `InfrastructureResult<T>` — Monad with retry/timeout/circuit-breaker
- `PresentationResult<T>` — DU: `{ _tag: 'Success', data }` | `{ _tag: 'Failure', error }`

**Drizzle Client Singleton:**
- Purpose: Single connection pool proxy with lazy initialization
- File: `src/Lib/Drizzle/Config/drizzle.client.ts`
- Pattern: Proxy pattern on empty object triggers `getDatabaseClient()` on first access

**Connection Pool Config:**
- Purpose: Environment-aware pool sizing
- File: `src/Lib/Drizzle/Database/connection.pool.ts`
- Pattern: Factory function returning config object

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Triggers: Next.js request handling
- Responsibilities: HTML shell, font loading (Geist, Inter), provider injection, global CSS

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: Visit to `/`
- Responsibilities: Basic landing page (currently placeholder `<h1>Home Page</h1>`)

**Database Scripts:**
- `pnpm db:test` → `src/Scripts/test-db.ts` — tests connection via `checkDatabaseHealth()`
- `pnpm db:debug` → `src/Scripts/debug-env.ts` — debugs environment variable loading

**CLI Commands:**
- `pnpm db:drizzleGenerate` — Generate schema from Drizzle definitions
- `pnpm db:drizzleMigrate` — Apply migrations to DB
- `pnpm db:drizzleDrop` — Drop database
- `pnpm db:drizzleStudio` — Launch Drizzle Studio UI

**Route Groups (Pages):**
- `src/app/(admin)/dashboard/` — Admin dashboard (empty)
- `src/app/(user)/dashboard/` — User dashboard (empty)
- `src/app/api/` — API routes (empty directory)

## Architectural Constraints

- **Serialization Boundary Rule:** Any object crossing the network boundary (Server Action → Client) MUST be a plain object (Discriminated Union). Classes cannot cross this boundary.
- **Import Boundaries:** Domain imports nothing; Application imports Domain only; Infrastructure imports Domain + Application; Presentation imports Application only
- **Explicit Mapping:** All layer crossings must use explicit mappers (no implicit type coercion)
- **Return Type Conformance:** UseCases return `ApplicationResult<T, E>`; Server Actions return `PresentationResult<T>`; Domain entities return `DomainResult<T, DomainError>`
- **OOP in inner layers:** Domain, Application, Infrastructure layers use OOP Classes (behavior encapsulation)
- **DU in Presentation:** Presentation layer uses Discriminated Unions only (no behavior/methods)
- **Tree-Shaking:** Static functions preferred in Presentation for dead-code elimination
- **Singleton Database Client:** Drizzle client uses Singleton pattern via Proxy (`src/Lib/Drizzle/Config/drizzle.client.ts`)
- **CQRS Separation:** Queries and Commands are in separate subdirectories at both Application and Infrastructure levels

## Anti-Patterns

### Placeholder/Stub Files

**What happens:** Multiple files exist as empty stubs with no implementation:
- `src/Lib/BetterAuth/Config/server.ts` (0 lines)
- `src/Lib/BetterAuth/Config/client.ts` (0 lines)
- `src/Lib/BetterAuth/Config/index.ts` (0 lines)
- `src/Lib/BetterAuth/utils/get-session.ts` (0 lines)
- `src/CompositionRoot/container.ts` (0 lines)
- `src/CompositionRoot/Bindings/index.ts` (0 lines)
- `src/CompositionRoot/Containers/index.ts` (0 lines)
- `src/Core/Kernel/Constants/error-codes.constants.ts` (0 lines)
- `src/Core/Kernel/Constants/layer-names.constants.ts` (0 lines)
- All abstract/concrete error and result files in `src/Core/Foundations/**/` (0 lines)
- All Domain Repository interfaces (0 lines)
- All Application UseCase files (0 lines)
- All Infrastructure Repository files (0 lines)

**Why it's wrong:** Scaffolding creates maintenance overhead without delivering value. These files will cause confusion about what's implemented vs planned. The Architecture docs describe a full Error/Result system but no concrete implementations exist.

**Do this instead:** Either fully implement the files or remove them until ready to implement. Use `TODO` comments or a tracking system for planned work.

## Error Handling

**Strategy:** Layered error propagation with typed error/result monads.

**Patterns:**
- Each layer has its own Error type that wraps/references the lower layer's error via `cause`
- Cross-layer error translation via explicit mappers (e.g., `domain-to-application-error.mapper.ts`)
- PresentationError (DU) is the final serializable form — no stack traces, no internal details
- PresentationError variants: `ValidationError`, `NotFoundError`, `AuthorizationError`, `SystemError`, `NetworkError`
- Currently no concrete implementation — all error files are empty stubs

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` (no structured logging library; Architecture docs describe structured logging via `ApplicationResult.tap()` but not yet implemented)

**Validation:** Zod ^4.4.3 available as dependency; `@tanstack/react-form` provides form-level validation; no domain validation layer yet

**Authentication:** Better Auth library selected, schema defined, but server/client config files are empty placeholders — auth middleware and route handlers not yet created

---

*Architecture analysis: 2026-06-07*
