# Phase 8: Module Integration & Server Actions — Context

**Gathered:** 2026-06-22
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

- **D-01 (Q-01): One file per action** — Each Server Action gets its own file (e.g., `sign-in.action.ts`, `sign-up.action.ts`). Matches existing single-file-per-entity pattern in Foundations layers. Clear imports, easy to locate by name.
- **D-02 (Q-02): Wire Composition Root** — Implement `container.ts` with concrete bindings. Server Actions import from Composition Root rather than instantiating dependencies inline. Files must be short and organized per Composition Root structure — no padding or overlapping of DI files. The initial setup must be correct.
- **D-03 (Q-03): Always `PresentationResult<T | null>`** — Every Server Action returns `PresentationResult`, with `null` data for side-effect-only actions (e.g., sign-out). Uniform contract — client always unwraps via `_tag` matching. No void-return or redirect-throwing for data actions.

### Better Auth Integration

- **D-04 (Q-04): Email/password only** — Implement sign-in, sign-up, sign-out with email/password via Better Auth. Wire `server.ts` and `client.ts` with real config. OAuth providers deferred to Phase 9.
- **D-05 (Q-05): Wrap Better Auth in Infrastructure layer** — Treat Better Auth as an external service. Create a Better Auth service wrapper in the Infrastructure layer that wraps calls with `InfrastructureResult` and `withRetry`/`withTimeout`. Errors flow through the full layer chain: InfrastructureError → (mapper) → ApplicationError → (mapper) → PresentationError. Validates complete stack traversal.

### Middleware & Correlation ID Flow

- **D-06 (Q-06): AsyncLocalStorage request context** — Use Node.js `AsyncLocalStorage` (available in Next.js 16) for per-request correlation ID propagation. Middleware (proxy.ts) initializes the context with a generated `CorrelationId` on every request. Server Actions and downstream layers read from the async context. Most idiomatic approach for Next.js 16 request-scoped data.
- **D-07 (Q-07): `proxy.ts` with correlation ID only** — Create `proxy.ts` (Next.js 16 convention per AGENTS.md) at project root. Single responsibility: generate and propagate correlation IDs. Auth checks happen in Server Actions where the error system handles them properly. No auth guard logic in middleware.

### Client Consumption Patterns

- **D-08 (Q-08): `useActionState` with inline `_tag` matching** — Use Next.js `useActionState` hook directly in client components. Each component performs its own `_tag` switch to render success state, error state, etc. Consistent with Phase 6 D-10 (no narrowing helpers). No shared `useServerAction` hook — keep it simple for Phase 8.
- **D-09 (Q-09): Hybrid error feedback** — `ValidationError.fieldErrors` rendered inline next to corresponding form fields. `SystemError` and `AuthorizationError` surfaced via sonner toast notifications. `NotFoundError` shown as inline message. Industry-standard UX pattern.

### Page & Route Coverage

- **D-10 (Q-10): Sign-in, Sign-up, User Dashboard, Admin Dashboard** — Create sign-in page and sign-up page with auth forms. User dashboard and admin dashboard are blank pages with basic route protection — initialization only, no detailed content. Role-based access (admin vs user) is NOT implemented in Phase 8 — deferred to Phase 9 (Authorization module). Phase 9 will build the Roles and Permissions System and link it to auth.
- **D-11 (Q-11): Server Component page with `@tanstack/react-form`** — Auth pages are Server Components (RSC). Auth forms use `@tanstack/react-form` for form state management. Aligns with strategic adoption of the TanStack ecosystem. Provides superior DX for complex form scenarios in future phases.

### Error Boundaries

- **D-12 (Q-12): Global + per-route error boundaries** — Create `error.tsx` at `src/app/` root for catch-all unhandled errors showing generic recovery UI with retry button. Add route-specific `error.tsx` for `(admin)/dashboard` and `(user)/dashboard` with contextual recovery options. Both must log the full cause-chain context for debugging.

### Module Implementations & Wiring

- **D-13 (Q-13): Keep Foundation export limited** — `Foundations/index.ts` stays Base-only as decided in Phase 7 D-10. Server Actions import layers directly (`@/Core/Foundations/Presentation/...`, `@/Core/Foundations/Application/...`, etc.). More explicit import paths, clearer dependency graph, no single point of coupling.
- **D-14 (Q-14): Full module stack: UseCase → Repository → Drizzle** — Implement the complete Authentication module layer chain:
  - **Domain**: Repository interfaces (Command + Query), Domain errors for user/auth operations
  - **Application**: UseCases (Commands for sign-in/sign-up/sign-out, Queries for session check), DTOs, mappers from Domain
  - **Infrastructure**: Repository implementations with `InfrastructureResult`, `withRetry`/`withTimeout`, Drizzle queries, DB mappers
  - **Presentation**: Server Actions calling Application UseCases, returning `PresentationResult`
  - Validates ALL 5 layers end-to-end.

### the agent's Discretion

- Exact file naming for action files (e.g., `sign-in.action.ts` vs `signInAction.ts`)
- Exact Composition Root binding structure and container implementation pattern
- AsyncLocalStorage context implementation (store shape, getter/setter functions)
- `@tanstack/react-form` configuration, field component mapping, validation wiring
- Toast notification styling, positioning, and duration
- Error boundary recovery UI design and retry logic
- Loading/skeleton states for auth pages and dashboards
- Exact `errorCode` format for module-specific errors (follows Kernel's uppercase snake_case convention)
- Better Auth server config (email/password only, session settings, cookie config)
- Drizzle query structure in repository implementations

</decisions>

<specifics>
## Specific Ideas

- "@tanstack/react-form is chosen to establish a professional, consistent form management pattern across all modules. This aligns with our strategic adoption of the TanStack ecosystem and provides superior developer experience for complex form scenarios in future phases." (Q-11 chat_more)
- "The initial setup must be correct. The work should be organized and divided, following the principle of code separation. Files should always contain short code snippets relevant to their intended purpose, and there should be no padding or overlapping of DI files. The work should be organized according to the Composition Root structure." (Q-02 chat_more)
- Dashboards are blank/initialization only — no detailed content in Phase 8 (Q-10 chat_more)
- Role-based access (admin vs user dashboard separation) is specifically NOT in Phase 8 — it belongs to Phase 9's Authorization module (Q-10 chat_more)
- `proxy.ts` should follow Next.js 16 conventions as documented in AGENTS.md

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, import boundaries, data flow, Serialization Boundary Rule
- `docs/Base_System.md` — Error/Result system specification for all 5 layers, cross-layer transformation strategy, file structure
- `.planning/codebase/ARCHITECTURE.md` — Architecture audit, layer responsibilities, data flow diagrams, integration points
- `.planning/codebase/STACK.md` — Technology stack (Next.js 16, Better Auth, Drizzle ORM, shadcn/ui, TanStack)
- `.planning/codebase/STRUCTURE.md` — Current file layout
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

### Existing Stub Files (to be implemented)
- `src/Lib/BetterAuth/Config/server.ts` — EMPTY: Wire Better Auth server config
- `src/Lib/BetterAuth/Config/client.ts` — EMPTY: Wire Better Auth client config
- `src/Lib/BetterAuth/Config/index.ts` — EMPTY: Barrel
- `src/Lib/BetterAuth/utils/get-session.ts` — EMPTY: Wire session utility
- `src/CompositionRoot/container.ts` — EMPTY: Wire DI container
- `src/CompositionRoot/Bindings/index.ts` — EMPTY: Create bindings
- `src/CompositionRoot/Containers/index.ts` — EMPTY: Create containers

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

### Integration Points
- `src/CompositionRoot/` — Server Actions will import wired UseCases from here
- `src/Lib/BetterAuth/` — Better Auth server + client config to be wired
- `src/app/(admin)/dashboard/` — Admin dashboard page (blank directory, to be created)
- `src/app/(user)/dashboard/` — User dashboard page (blank directory, to be created)
- `src/Modules/Authentication/Presentation/Actions/` — Server Action files location (scaffolded directory)
- `src/Modules/Authentication/Presentation/Components/` — Auth UI components location (scaffolded directory)
- `proxy.ts` — Project root, to be created with AsyncLocalStorage middleware
- `src/Core/Foundations/Presentation/` — Mappers used by Server Actions to convert ApplicationResult → PresentationResult

### Domain-Specific Context
- The Authentication module uses Better Auth for session management, but wraps it in our Infrastructure layer (D-05)
- Better Auth is treated as an external service — the Infrastructure layer provides the abstraction boundary
- This means Better Auth errors pass through InfrastructureResult → InfrastructureError → ApplicationError → PresentationError
- Composition Root wires: UseCase → Repository (Infrastructure) → Drizzle client, and UseCase → BetterAuthService (Infrastructure)
- Auth pages use @tanstack/react-form which is already installed — no new npm dependencies

</code_context>

<deferred>
## Deferred Ideas

- **OAuth providers (Google, GitHub, etc.)** — Phase 9 (Production Auth). Phase 8 is email/password only (D-04).
- **Role-based access control** — Phase 9 (Authorization module). Admin/user dashboard separation NOT in Phase 8 (Q-10 chat_more).
- **Full Production Auth features** (2FA, passkeys, magic links, email verification, password reset) — Phase 9.
- **DTOs and DAL pattern discussion** — Deferred to Phase 9 context gathering per user preference.
- **Audit/logging infrastructure** — Phase 9 or later. Deferred from Phase 7 and Phase 8.
- **Testing beyond serialization safety** — Module-level integration tests deferred per PROJECT.md testing strategy.
- **Circuit breaker** — Deferred from Phase 5; not in Phase 8 scope.
- **i18n/locale-aware userMessage system** — Deferred from Phase 6; not revisited for Phase 8.
- **Full metadata on PresentationResult** (duration, timestamp, retryAfter) — Deferred from Phase 6; Phase 8 stays with minimal `operationId` only.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 8 scope.

</deferred>

---

*Phase: 08-module-integration-server-actions*
*Context gathered: 2026-06-22*
