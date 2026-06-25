# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-07)

**Core value:** Every error in the system is typed, traceable to its origin layer, and safely serializable — no untyped exceptions, no information leaks, no "cannot read properties of undefined" in production.
**Current focus: Phase 8 — Module Integration & Server Actions (In Progress)

## Current Position

Phase: 8 of 8 (Module Integration & Server Actions)
Plan: 4/9 executed (08-01 ✅, 08-02 ✅, 08-03 ✅, 08-04 ✅), 5 planned (08-05 → 08-09 across 5 waves)
Status: ◐ In Progress — Wave 2 complete (08-04: Domain auth types). Ready for Wave 3 (08-05).
Last activity: 2026-06-25 — 08-04 executed with AuthQueryRepository, 4 domain errors, aggregates, and AUTH_ERROR_CODES constants

Progress: [████████████████████] 100% (Phase 1) — [████████████████████] 100% (Phase 2) — [████████████████████] 100% (Phase 3) — [████████████████████████] 100% (Phase 4) — [████████████████████████] 100% (Phase 5) — [████████████████████] 100% (Phase 6) — [████████████████████] 100% (Phase 7) — [█████████░░░░░░░░░░░░░] 44% (Phase 8)

## Performance Metrics

**Velocity:**
- Total plans completed: 22 (executed across Phases 1-8)
- Total plans planned: 24 (Phase 7: 3, Phase 8: 9)
- Average duration: ~2.7 min
- Total execution time: ~43 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Kernel Layer | 2 | Planned | TBD |
| 2. Foundations Base Layer | 3 | 3/4 | ~6 min |
| 3. Domain Layer | 3 | 3/3 | ~6 min |
| 4. Application Layer | 2 | 4/4 | ~2 min |
| 5. Infrastructure Layer | 4 | Complete | ~3 min |

**Recent Trend:**
- Last 5 plans: 08-04 (~4 min), 08-03 (~3 min), 08-02 (~3 min), 08-01 (~5 min), 05-04 (~2 min)
- Trend: Consistent ~3.5 min per plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Kernel layer first — Foundations and Modules depend on Kernel primitives; must build bottom-up
- [Phase 1]: Branded types for CorrelationId, ErrorCode, OperationId prevent mixing at compile time
- [Phase 1]: Zero external dependencies for Kernel layer — pure TypeScript only
- [Phase 1]: Skip tests for Phase 1 (deferred per PROJECT.md)
- [Phase 1]: `as const` objects for enums (not TypeScript `enum`) — better tree-shaking, no reverse-mapping bloat
- [Phase 1]: Unique-symbol branded types with named factory functions — single `as` cast per factory
- [Phase 1]: ES2022 target needed for `unique symbol`, `Error.cause`, private fields
- [Phase 1]: `dependency-cruiser`, Biome `noRestrictedImports` setup to be included in Phase 1 plans
- [Phase 1]: ErrorBase cause is optional (`cause?: ErrorBase`) — root errors have no cause
- [Phase 1]: ResultBase includes `mapError` alongside `map`/`flatMap`/`match`/`fold`
- [Phase 1]: Validator contracts are interface-only (no implementations) per Pitfall 5 avoidance
- [Phase 1]: ErrorCodes constants object is empty by design — domain-specific codes added in Phase 3
- [Phase 1]: LayerNames uses `satisfies Record<keyof typeof LayerType, string>` to enforce key alignment
- [Phase 1]: WR-02 pre-existing errors resolved via `@ts-expect-error` directives
- [Phase 2]: ErrorBase abstract class: isRecoverable() defaults to false, getSeverity() defaults to ERROR, timestamp auto-generated, layer required in constructor, implements ErrorBaseContract with alias
- [Phase 2]: toJSON(): Set-based circularity tracking with `[Circular]` marker, nested cause chain, internal Set management
- [Phase 2]: ResultBase: minimal abstract base (only isSuccess/isFailure abstract), Success/Failure extend it, all in result-base.ts, ok()/err() as standalone functions
- [Phase 2]: Monadic: map/flatMap/tap on wrong variant = return self no-op; mapError on Success = no-op
- [Phase 2]: Validators: duck typing, satisfiesContract() = validate().isValid, surface-level only
- [Phase 2]: WR-01: Safe Result-wrapped factories in new Factories/ directory with ValidationError interface + factory
- [Phase 2]: Barrel: subdir index.ts re-exports all -> Base/index.ts -> Foundations/index.ts
- [Phase 2]: Zero external dependencies for Foundation layer (pure TypeScript)
- [Phase 2] [executed]: ErrorBase uses class property + conditional assignment (not constructor shorthand) for `cause` to satisfy `exactOptionalPropertyTypes` + `implements ErrorBaseContract`
- [Phase 2] [executed]: ResultBase abstract class uses `T | undefined` / `E | undefined` (not optional `T?`/`E?`) to satisfy `exactOptionalPropertyTypes`
- [Phase 2] [executed]: toJSON() uses recursive internal helper with Set-based circularity tracking
- [Phase 3] [context]: DomainError class: businessRule (required string), aggregateId (required string), layer hardcoded to LayerType.DOMAIN
- [Phase 3] [context]: DomainResult type alias: type DomainResult<T> = ResultBase<T, DomainError> — no subclass
- [Phase 3] [context]: domain-error.contract.ts kept; domain-result.contract.ts skipped
- [Phase 3] [context]: DomainErrorValidator checks layer === DOMAIN + businessRule non-empty string
- [Phase 3] [context]: isDomainError duck-types businessRule + aggregateId; no isDomainResult guard
- [Phase 3] [context]: Specific errors implemented flat (ComplaintNotFound, ComplaintAlreadyExists, UserNotFound) — no subdirectories
- [Phase 3] [context]: ValidationError stays as interface + factory in Base/Factories — no class upgrade
- [Phase 3] [context]: Domain/index.ts re-exports Contracts, Errors, Results only — no Base re-exports
- [Phase 3] [executed]: DomainErrorContract moved to dedicated Contracts/ directory (PascalCase) — follows Kernel/Base contract pattern; all imports updated
- [Phase 3] [context]: Zero external dependencies — Domain imports Kernel + Base only
- [Phase 4] [planned]: ApplicationError extends ErrorBase with operationName, correlationId, userId — named params constructor, layer=APPLICATION hardcoded
- [Phase 4] [planned]: ApplicationResult<T> = ResultBase<T, ApplicationError> — pure type alias, no contract/validator/type-guard (D-11/D-12)
- [Phase 4] [executed]: RequestContext { correlationId: CorrelationId; userId?: string } — method argument injection, NOT constructor (D-14/D-15/D-16)
- [Phase 4] [executed]: D-12 compliance — deleted scaffold stub files for contract/validator/type-guard; pure type alias pattern
- [Phase 4] [executed]: D-27 compliance — cleared empty subdirectories from Errors/Specific/; flat file organization
- [Phase 4] [executed]: CQRS separation: ICommandHandler + IQueryHandler with abstract decorator bases (D-17..D-22)
- [Phase 4] [executed]: mapDomainToAppError generic function — single mapper, passes domain error code/message as-is, preserves cause chain (D-23/D-24/D-25)
- [Phase 4] [executed]: Three specific errors: UseCaseExecutionError (cause mandatory, USE_CASE_EXECUTION_ERROR), AuthorizationFailedError (reason: string, AUTHORIZATION_FAILED), CommandValidationError (fieldErrors, COMMAND_VALIDATION_ERROR) — flat Specific/ directory (D-26/D-27)
- [Phase 4] [executed]: Barrel chain complete — Application/index.ts exports Contracts, Errors, Mappers, Results; Errors/index.ts includes Specific/ re-export (D-31/D-32/D-33)
- [Phase 5] [executed]: Infrastructure contracts defined: InfrastructureComponent, InfrastructureRetryStrategy, InfrastructureErrorContract (D-01..D-10)
- [Phase 5] [executed]: Scaffold cleanup per D-15, D-21, D-23 — Results stubs, old mapper stub, category subdirectories deleted
- [Phase 5] [executed]: InfrastructureError class extends ErrorBase with named params constructor — systemComponent, retryCount?, retryStrategy?, safeDetails?; layer=INFRASTRUCTURE hardcoded; isRecoverable() returns true (D-09)
- [Phase 5] [executed]: InfrastructureResult<T> = ResultBase<T, InfrastructureError> — pure type alias, no contract/validator/type-guard files (D-14/D-15)
- [Phase 5] [executed]: InfrastructureErrorValidator checks layer===INFRASTRUCTURE + systemComponent non-empty; isInfrastructureError duck-types only systemComponent (D-27/D-28)
- [Phase 5] [executed]: Barrel files follow Application layer pattern — Errors/index.ts + Results/index.ts
- [Phase 5] [executed]: 5 specific InfrastructureError subclasses created (DatabaseConnectionError, DatabaseQueryError, ApiTimeoutError, ApiUnavailableError, CacheUnavailableError) — all follow named-params constructor pattern with hardcoded codes and correct systemComponent values (D-24/D-25)
- [Phase 5] [executed]: mapInfrastructureToAppError() generic mapper and sanitizeInfraError() sanitization utility created — sanitizer defaults to sanitized mode, strips hostnames/IPs/stack traces, debug flag opt-out (D-11/D-12/D-13/D-21/D-22)
- [Phase 5] [executed]: Mappers/index.ts barrel exports both mapper and sanitize function; Specific/index.ts barrel re-exports all 5 specific errors
- [Phase 5] [executed]: withRetry uses internal recursive `attempt()` helper with exponential backoff (baseDelay * 2^attempt + random jitter), clamped to maxDelayMs; on exhaustion creates RETRY_EXHAUSTED InfrastructureError with last attempt as cause
- [Phase 5] [executed]: withTimeout uses async/await with try/catch — timeout Promise rejects, catch converts to InfrastructureResult Failure; never throws
- [Phase 5] [executed]: withFallback is pure synchronous function — if Success returns unchanged, if Failure returns `ok(fallback)`
- [Phase 5] [executed]: Infrastructure/index.ts top-level barrel follows Application/index.ts pattern: `export * from` for Contracts, Errors, Mappers, Results, Resilience (in that order)

- [Phase 8] [executed]: Hybrid 4+6 Composition pattern — module-owned Composition/{tokens,registration}.ts, CompositionRoot/index.ts orchestrator (19a7f4d)
- [Phase 8] [executed]: Container hardened — Map<symbol> tokens, singleton=false default, TOKENS unified object
- [Phase 8] [executed]: fold removed from ResultBase — match only dispatch method (bc61d52)
- [Phase 8] [executed]: Better Auth server/client config with Drizzle adapter, email/password
- [Phase 8] [executed]: proxy.ts with AsyncLocalStorage correlation ID propagation
- [Phase 8] [executed]: BetterAuthService wrapping Better Auth with InfrastructureResult, withRetry, withTimeout
- [Phase 8] [executed]: AUTH_ERROR_CODES const object with 4 codes (USER_NOT_FOUND, INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS, AUTH_FAILED) + AuthErrorCode union type
- [Phase 8] [executed]: 4 auth-specific domain errors (UserNotFoundError, InvalidCredentialsError, EmailAlreadyExistsError, AuthenticationFailedError) — all extend DomainError with positional params
- [Phase 8] [executed]: AuthenticatedUser and AuthSession aggregate interfaces matching DB schema shapes
- [Phase 8] [executed]: AuthQueryRepository interface with findByEmail/findById — pure TypeScript, no InversifyJS decorators
- [Phase 8] [context]: Switch to InversifyJS — replace custom Container with InversifyJS (D-02/D-15)
- [Phase 8] [context]: Module-owned ContainerModules — each module exports its own, CompositionRoot loads all (D-15)
- [Phase 8] [context]: Symbol-based tokens — Symbol.for('Module.InterfaceName') (D-16)
- [Phase 8] [context]: Transient default lifetime — explicit singleton only for infra services (D-17)
- [Phase 8] [context]: Request scoping deferred — not needed for Phase 8 (D-18)
- [Phase 8] [context]: Remove old Bindings/ and Containers/ directories (D-20)
- [Phase 8] [context]: Rewrite plans 08-01, 08-04 through 08-09 — 08-01 reopened to include InversifyJS migration (D-21)

### Blockers/Concerns

None yet.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Testing | All test writing deferred to later phases | Planned | 2026-06-07 |

## Session Continuity

Last session: 2026-06-25
Stopped at: Phase 8 — Wave 2 complete (08-04: Domain auth types). Ready for Wave 3.
Resume file: `.planning/phases/08-module-integration-server-actions/08-CONTEXT.md`
Next command: `/gsd-execute-phase 08 --wave 3` — Execute Wave 3: 08-05 (Application UseCases)

## Phase 8 Plans (2026-06-25 — 08-04 executed)

4 plans complete (08-01 ✅, 08-02 ✅, 08-03 ✅, 08-04 ✅), 5 planned (08-05→08-09):

**Wave 1 (Plumbing ✅):**
- [x] 08-01: Migrate to InversifyJS + Hybrid 4+6

**Wave 2 (Domain auth types ✅):**
- [x] 08-04: **[REWRITTEN]** Domain layer — repository interfaces (interface-only, no InversifyJS), auth domain errors, aggregates

**Wave 3 (Application UseCases):**
- [ ] 08-05: **[REWRITTEN]** Application layer — UseCases with @injectable() + @inject(), DTOs, mappers

**Wave 4 (Infrastructure repos):**
- [ ] 08-06: **[REWRITTEN]** Infrastructure layer — Drizzle repositories with @injectable(), DB mappers

**Wave 5 (Server Actions):**
- [ ] 08-07: **[REWRITTEN]** Server Actions — resolve from InversifyJS container, Better Auth API route

**Wave 6 (Auth pages):**
- [ ] 08-08: **[REWRITTEN]** Auth pages (sign-in, sign-up) with @tanstack/react-form

**Wave 7 (Error boundaries):**
- [ ] 08-09: **[REWRITTEN]** Dashboards + global + per-route error boundaries

