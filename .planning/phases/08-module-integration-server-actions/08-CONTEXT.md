# Phase 8: Module Integration & Server Actions — Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 8 delivers:** End-to-end integration of the 5-layer Error/Result system with real Next.js Server Actions, middleware, and client components. Wire the complete Foundation layers into working auth pages (sign-in, sign-up, dashboards) with proper error propagation through all layers, AsyncLocalStorage correlation ID middleware, React error boundaries, and full module implementations (UseCase → Repository → Drizzle).

**What Phase 8 does NOT deliver:**
- OAuth providers — deferred to Phase 9 (Production Auth)
- Full role-based access control — deferred to Phase 9 (Authorization module)
- Production-ready auth features (2FA, passkeys, magic links, email verification) — deferred to Phase 9
- Module-specific features beyond auth scaffold — deferred
- Testing beyond the serialization safety tests from Phase 7
- Audit/logging infrastructure — deferred to Authorization phase
</domain>

<decisions>
## Implementation Decisions

### Server Action Architecture
- **D-01 (carried forward): One file per action** — Each Server Action gets its own file (e.g., `sign-in.action.ts`, `sign-up.action.ts`). Matches existing single-file-per-entity pattern in Foundations layers. Clear imports, easy to locate by name.

### Composition Root & DI Container
- **D-02 (updated): Switch to InversifyJS** — Replace the custom lightweight Container class with InversifyJS. Install `inversify` as a dependency during plan execution. The existing custom `Container` class (`src/CompositionRoot/container.ts`) will be replaced with InversifyJS `Container` from the library. Provides decorator-based injection, lifetime management, and production-grade DI.
- **D-15 (new): Hybrid 4+6 Composition with ContainerModules** — Each module owns a `ContainerModule` in its `Composition/registration.ts`. Modules export their own module, CompositionRoot/index.ts creates the base container and loads all modules via `container.load(module1, module2, ...)`. Maintains module isolation, enables contextual binding per module, and satisfies the Hybrid 4+6 pattern.
- **D-16 (new): Symbol-based binding tokens** — Use `Symbol.for('Module.InterfaceName')` as InversifyJS binding identifiers. Example: `Symbol.for('Auth.ICommandAuthRepository')`, `Symbol.for('Auth.SignInUseCase')`. Compatible with InversifyJS, prevents cross-module token collisions, preserves namespace safety for multi-team development.
- **D-17 (new): Transient lifetime default** — All InversifyJS bindings default to transient (new instance per resolve). Explicit `.inSingletonScope()` only for infrastructure singletons (DB connection pool, Redis clients, logging). Transient default ensures no accidental state leakage between requests and maintains testability.
- **D-18 (new): Request scoping deferred** — Per-request lifetime scope not needed for Phase 8. Add when a concrete use case emerges (e.g., per-request unit of work).
- **D-19 (new): File separation for Composition Root** — `container.ts` handles InversifyJS container setup only. `CompositionRoot/index.ts` handles orchestration (creating container, loading modules). Separates configuration from composition.
- **D-20 (new): Remove old Bindings/ and Containers/** — Delete `src/CompositionRoot/Bindings/` and `src/CompositionRoot/Containers/` directories. Hybrid 4+6 with module-owned Composition/ replaces them entirely.

### Better Auth Integration
- **D-04 (carried forward): Email/password only** — Implement sign-in, sign-up, sign-out with email/password via Better Auth. Wire `server.ts` and `client.ts` with real config. OAuth providers deferred to Phase 9.
- **D-05 (carried forward): Wrap Better Auth in Infrastructure layer** — Treat Better Auth as an external service. Create a Better Auth service wrapper in the Infrastructure layer that wraps calls with `InfrastructureResult` and `withRetry`/`withTimeout`. Errors flow through the full layer chain: InfrastructureError → (mapper) → ApplicationError → (mapper) → PresentationError. Validates complete stack traversal.

### Middleware & Correlation ID Flow
- **D-06 (carried forward): AsyncLocalStorage request context** — Use Node.js `AsyncLocalStorage` (available in Next.js 16) for per-request correlation ID propagation. Middleware (proxy.ts) initializes the context with a generated `CorrelationId` on every request. Server Actions and downstream layers read from the async context.
- **D-07 (carried forward): `proxy.ts` with correlation ID only** — Create `proxy.ts` at `src/proxy.ts`. Single responsibility: generate and propagate correlation IDs. Auth checks happen in Server Actions where the error system handles them properly.

### Client Consumption Patterns
- **D-08 (carried forward): `useActionState` with inline `_tag` matching** — Use Next.js `useActionState` hook directly in client components. Each component performs its own `_tag` switch to render success state, error state, etc.
- **D-09 (carried forward): Hybrid error feedback** — `ValidationError.fieldErrors` rendered inline next to corresponding form fields. `SystemError` and `AuthorizationError` surfaced via sonner toast notifications. `NotFoundError` shown as inline message.

### Page & Route Coverage
- **D-10 (carried forward): Sign-in, Sign-up, User Dashboard, Admin Dashboard** — Create sign-in page and sign-up page with auth forms. User dashboard and admin dashboard are blank pages with basic route protection — initialization only, no detailed content. Role-based access deferred to Phase 9.
- **D-11 (carried forward): Server Component page with `@tanstack/react-form`** — Auth pages are Server Components (RSC). Auth forms use `@tanstack/react-form` for form state management.

### Error Boundaries
- **D-12 (carried forward): Global + per-route error boundaries** — Create `error.tsx` at `src/app/` root for catch-all. Add route-specific `error.tsx` for `(admin)/dashboard` and `(user)/dashboard`. Both must log the full cause-chain context.

### Module Implementations & Wiring
- **D-13 (carried forward): Keep Foundation export limited** — `Foundations/index.ts` stays Base-only as decided in Phase 7 D-10. Server Actions import layers directly (`@/Core/Foundations/Presentation/...`, `@/Core/Foundations/Application/...`, etc.).
- **D-14 (carried forward): Full module stack: UseCase → Repository → Drizzle** — Implement the complete Authentication module layer chain: Domain (repository interfaces + errors), Application (UseCases + DTOs), Infrastructure (repository implementations + mappers), Presentation (Server Actions).

### Plan Rewrite
- **D-21 (new): Rewrite plans 08-04 through 08-09** — Update all pending plans to reflect Hybrid 4+6 Composition, InversifyJS ContainerModules, and the new module-owned Composition pattern. Plan 08-04 becomes a standalone "Migrate to InversifyJS + cleanup" plan that replaces the custom Container, converts registrations to ContainerModules, and removes old Bindings/Containers/ directories.

### the agent's Discretion
- Exact file naming for action files (e.g., `sign-in.action.ts` vs `signInAction.ts`)
- AsyncLocalStorage context implementation (store shape, getter/setter functions) — already implemented
- `@tanstack/react-form` configuration, field component mapping, validation wiring
- Toast notification styling, positioning, and duration
- Error boundary recovery UI design and retry logic
- Loading/skeleton states for auth pages and dashboards
- Exact `errorCode` format for module-specific errors (follows Kernel's uppercase snake_case convention)
- Better Auth server config (email/password only, session settings, cookie config)
- Drizzle query structure in repository implementations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, import boundaries, data flow, Serialization Boundary Rule
- `docs/Base_System.md` — Error/Result system specification for all 5 layers, cross-layer transformation strategy, file structure
- `.planning/codebase/ARCHITECTURE.md` — Architecture audit, layer responsibilities, data flow diagrams, integration points
- `.planning/codebase/STACK.md` — Technology stack (Next.js 16, Better Auth, Drizzle ORM, shadcn/ui, TanStack)
- `.planning/codebase/STRUCTURE.md` — Current file layout (note: outdated — Composition Root now follows Hybrid 4+6 with InversifyJS)
- `.planning/codebase/INTEGRATIONS.md` — Better Auth integration points, Drizzle setup

### Prior Phase Contexts (locked decisions)
- `.planning/phases/07-tooling-boundary-enforcement/07-CONTEXT.md` — Phase 7 decisions (D-10: Foundations Base-only barrel, deferred items)
- `.planning/phases/06-presentation-layer/06-CONTEXT.md` — Phase 6 decisions (D-01 through D-18: PresentationError variants, PresentationResult shape, no narrowing helpers)
- `.planning/phases/05-infrastructure-layer/05-CONTEXT.md` — Phase 5 decisions (InfrastructureError, InfrastructureResult, resilience wrappers, mapper pattern)
- `.planning/phases/04-application-layer/04-CONTEXT.md` — Phase 4 decisions (ApplicationError, CQRS handler interfaces, mapper pattern, RequestContext)
- `.planning/phases/03-domain-layer/03-CONTEXT.md` — Phase 3 decisions (DomainError, DomainResult, repository interfaces)
- `.planning/phases/02-foundations-base-layer/02-CONTEXT.md` — Phase 2 decisions (ErrorBase, ResultBase, barrel chain, duck typing)

### Existing Source Files (implementation references)
- `src/Core/Foundations/Presentation/` — All Presentation layer DU types, factory functions, mappers
- `src/Core/Foundations/Application/` — ApplicationError, ApplicationResult, CQRS handler interfaces, domain→app mapper
- `src/Core/Foundations/Infrastructure/` — InfrastructureError, resilience wrappers, sanitization, infra→app mapper
- `src/Core/Foundations/Domain/` — DomainError, DomainResult, repository interfaces
- `src/Core/Foundations/Base/` — ErrorBase, ResultBase, validators, type guards, factories
- `src/Modules/Authentication/Infrastructure/Database/Schema/` — Auth DB tables (user, session, account, verification)
- `src/Modules/Authentication/Infrastructure/Database/Relations/relations.ts` — Drizzle relations
- `src/CompositionRoot/container.ts` — CURRENT (to be replaced): lightweight Container class
- `src/CompositionRoot/index.ts` — CURRENT (to be updated): orchestrator calling registerAuthBindings
- `src/Modules/Authentication/Composition/tokens.ts` — Symbol-based token definitions (to be converted to InversifyJS)
- `src/Modules/Authentication/Composition/registration.ts` — Binding stubs (to be converted to InversifyJS ContainerModule)
- `src/Modules/Authentication/Composition/index.ts` — Barrel (to be updated)

### Existing Implemented Files (Wave 1 — done)
- `src/Lib/BetterAuth/Config/server.ts` — Better Auth server config with Drizzle adapter, email/password
- `src/Lib/BetterAuth/Config/client.ts` — Better Auth client config
- `src/Lib/BetterAuth/Config/index.ts` — Barrel exports
- `src/Lib/BetterAuth/utils/get-session.ts` — `getSession(headers)` utility
- `src/Lib/RequestContext/store.ts` — AsyncLocalStorage store with get/set helpers
- `src/Lib/RequestContext/index.ts` — Barrel
- `src/proxy.ts` — Next.js 16 proxy middleware with correlation ID propagation
- `src/Modules/Authentication/Infrastructure/Services/BetterAuth/better-auth.service.ts` — BetterAuthService with InfrastructureResult wrapping
- `src/Modules/Authentication/Infrastructure/Services/BetterAuth/index.ts` — Barrel
- `src/Modules/Authentication/Infrastructure/Services/index.ts` — Parent barrel

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria for Phase 8
- `.planning/STATE.md` — Current position tracking
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Requirement traceability

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All 5 Foundation layers fully implemented** (83 source files) — PresentationError/PresentationResult DUs, ApplicationError hierarchy with CQRS handlers, InfrastructureError with withRetry/withTimeout/withFallback, DomainError/DomainResult, ErrorBase/ResultBase. Ready to wire.
- **Serialization safety tests** (`src/Core/Foundations/Presentation/__tests__/serialization-safety.test.ts`) — 3628 bytes, validates prototype leak + JSON round-trip + _tag discriminant preservation. Already passing.
- **Auth DB schema** (4 tables: user, session, account, verification) — Drizzle `pgTable` definitions with relations. Ready for repository implementations.
- **shadcn/ui components** (50+ in `src/Shared/components/ui/`) — Form, Button, Card, Input, Toast, etc. Available for auth page UI.
- **sonner toast** — Already wired in `provider.tsx`. Ready for error display (D-09).
- **@tanstack/react-form** — Already installed. Ready for form state management (D-11).

### Established Patterns
- **One file per entity** — Every Foundation layer follows single-class/single-function per file with barrel re-exports (Phase 2 D-29..D-31). D-01 extends this to Server Actions.
- **Named params for multi-param functions** — Prior phases use params objects for functions with >2 parameters.
- **Error code format** — Uppercase snake_case convention from Kernel's `ErrorCode` branded type.
- **Standalone factory functions** — `ok()`/`err()` pattern from Base layer, factory functions per PresentationError variant.
- **Barrel chain** — Subdirectory `index.ts` → parent `index.ts`. All Foundation layers follow this.
- **Duck typing for type guards** — Property-based structural checks, no `instanceof` in guard functions.
- **Hybrid 4+6 Composition** — Each module owns `Composition/{tokens,registration}.ts`. CompositionRoot orchestrates by loading modules.
- **InversifyJS ContainerModules** — Each module exports its own `ContainerModule`. CompositionRoot loads them all.

### Integration Points
- `src/CompositionRoot/` — Will be updated: container.ts (InversifyJS setup), index.ts (module loading orchestration)
- `src/Modules/Authentication/Composition/` — Will be updated: registration.ts converts to ContainerModule, tokens.ts uses Symbol.for()
- `src/Lib/BetterAuth/` — Better Auth server + client config already wired
- `src/app/(admin)/dashboard/` — Admin dashboard page (blank directory)
- `src/app/(user)/dashboard/` — User dashboard page (blank directory)
- `src/Modules/Authentication/Presentation/Actions/` — Server Action files location (scaffolded directory)
- `src/Modules/Authentication/Presentation/Components/` — Auth UI components location (scaffolded directory)
- `src/proxy.ts` — Already implemented with AsyncLocalStorage middleware
- `src/Core/Foundations/Presentation/` — Mappers used by Server Actions

### Domain-Specific Context
- The Authentication module uses Better Auth for session management, but wraps it in our Infrastructure layer (D-05)
- Better Auth is treated as an external service — the Infrastructure layer provides the abstraction boundary
- This means Better Auth errors pass through InfrastructureResult → InfrastructureError → ApplicationError → PresentationError
- Composition Root loads InversifyJS ContainerModules from each module — modules own their bindings
- Auth pages use @tanstack/react-form which is already installed — no new npm dependencies
- `inversify` to be installed during plan execution (Migration Plan 08-04)

</code_context>

<specifics>
## Specific Ideas

- "@tanstack/react-form is chosen to establish a professional, consistent form management pattern across all modules. This aligns with our strategic adoption of the TanStack ecosystem." (from prior context)
- "The initial setup must be correct. The work should be organized and divided, following the principle of code separation." (from prior context)
- "Module-owned ContainerModules is the gold standard for large projects — achieves scalability and maintainability. Centralized is a temporary solution for small projects, not for enterprise scaling." (new — D-15 discussion)
- "Symbol-based tokens is the gold standard in Clean Architecture — separates definition (What using Symbol + interface) from implementation (How using concrete class). Achieves the 'depend on abstractions' principle core to the 4+6 pattern." (new — D-16 discussion)
- "Transient default is defensive container design that serves large complex projects. Changing default to Singleton is premature optimization that leads to fragile hard-to-maintain code in a 4+6 architecture." (new — D-17 discussion)
- Dashboards are blank/initialization only — no detailed content in Phase 8 (D-10)
- Role-based access (admin vs user dashboard separation) is specifically NOT in Phase 8 — it belongs to Phase 9's Authorization module (D-10)
- `proxy.ts` follows Next.js 16 conventions — already implemented at `src/proxy.ts` (D-07)

</specifics>

<deferred>
## Deferred Ideas

- **OAuth providers (Google, GitHub, etc.)** — Phase 9 (Production Auth). Phase 8 is email/password only.
- **Role-based access control** — Phase 9 (Authorization module). Admin/user dashboard separation NOT in Phase 8.
- **Full Production Auth features** (2FA, passkeys, magic links, email verification, password reset) — Phase 9.
- **DTOs and DAL pattern discussion** — Deferred to Phase 9 context gathering per user preference.
- **Audit/logging infrastructure** — Phase 9 or later. Deferred from Phase 7 and Phase 8.
- **Testing beyond serialization safety** — Module-level integration tests deferred per PROJECT.md testing strategy.
- **Circuit breaker** — Deferred from Phase 5; not in Phase 8 scope.
- **i18n/locale-aware userMessage system** — Deferred from Phase 6; not revisited for Phase 8.
- **Full metadata on PresentationResult** (duration, timestamp, retryAfter) — Deferred from Phase 6.
- **Request-scoped DI lifetimes** — Deferred. Not needed for Phase 8; add when concrete use case emerges (D-18).

### Reviewed Todos (not folded)
None — no pending todos matched Phase 8 scope.

</deferred>

---

*Phase: 08-module-integration-server-actions*
*Context gathered: 2026-06-23*
