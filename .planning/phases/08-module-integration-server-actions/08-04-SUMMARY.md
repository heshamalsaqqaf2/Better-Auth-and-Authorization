---
phase: 08-module-integration-server-actions
plan: 04
subsystem: auth
tags: [domain, errors, aggregates, repository, pure-typescript]

# Dependency graph
requires:
  - phase: 03-domain-layer
    provides: DomainError base class, DomainResult type
  - phase: 08-01-inversifyjs-migration
    provides: AUTH_TOKENS.QUERY_AUTH_REPOSITORY Symbol.for token
provides:
  - Auth-specific domain error classes (4) extending DomainError with AUTH_ERROR_CODES constants
  - AuthenticatedUser and AuthSession aggregate interfaces
  - AuthQueryRepository interface (pure TypeScript — no InversifyJS decorators)
affects: [08-05, 08-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DomainError subclassing with positional constructor params matching Foundation API"
    - "as const error code objects with union type helper"
    - "Pure TypeScript repository interfaces — no I prefix, no decorators"

key-files:
  created:
    - src/Modules/Authentication/Domain/Errors/error-codes.constants.ts
    - src/Modules/Authentication/Domain/Errors/user-not-found.error.ts
    - src/Modules/Authentication/Domain/Errors/invalid-credentials.error.ts
    - src/Modules/Authentication/Domain/Errors/email-already-exists.error.ts
    - src/Modules/Authentication/Domain/Errors/authentication-failed.error.ts
    - src/Modules/Authentication/Domain/Errors/index.ts
    - src/Modules/Authentication/Domain/Aggregates/authenticated-user.ts
    - src/Modules/Authentication/Domain/Aggregates/index.ts
    - src/Modules/Authentication/Domain/Repositories/Queries/auth-query.repository.ts
  modified:
    - src/Modules/Authentication/Domain/Repositories/Queries/index.ts

key-decisions:
  - "Use AUTH_ERROR_CODES constants object (as const) instead of hardcoded strings in domain errors — matches Foundation error-codes pattern"
  - "Null for not-found in repository query methods (findByEmail/findById return AuthenticatedUser | null) — not-found is a successful query result, not an error condition"
  - "Token excluded from AuthSession aggregate — managed by BetterAuth, not exposed via Domain"
  - "No UserAggregateCreateInput — sign-up input handled via Application-layer DTOs"
  - "Pure TypeScript interfaces for repository contracts — no @injectable(), no I prefix, bound via Symbol.for() in ContainerModule"

patterns-established:
  - "Auth domain errors: positional constructor signature (message, businessRule, aggregateId, cause?) matching Foundation DomainError"
  - "Aggregate interfaces: pure data contracts that match DB schema shape but exclude secrets/tokens"
  - "Repository interfaces: pure TypeScript with DomainResult<T> return types, no InversifyJS dependency"

requirements-completed: [DOMN-ERRORS, DOMN-AGGREGATES, DOMN-REPO-QUERY, DOMN-ERROR-CODES]

# Metrics
duration: 4min
completed: 2026-06-25
---

# Phase 8 Plan 4: Domain Layer — Auth Errors, Aggregates, Repository Interface Summary

**Auth-specific domain errors (4 classes extending DomainError), AuthenticatedUser/AuthSession aggregate interfaces, and AuthQueryRepository pure TypeScript contract — all using AUTH_ERROR_CODES constants from the Foundation pattern**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-25T03:05:16+03:00
- **Completed:** 2026-06-25T03:08:49+03:00
- **Tasks:** 4
- **Files modified:** 10 (9 created, 1 updated)

## Accomplishments

- `AUTH_ERROR_CODES` const object with 4 codes (`USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `AUTH_FAILED`) plus `AuthErrorCode` union type — follows Foundation error-codes pattern
- Four auth-specific domain error classes (`UserNotFoundError`, `InvalidCredentialsError`, `EmailAlreadyExistsError`, `AuthenticationFailedError`) — each extends `DomainError`, uses `AUTH_ERROR_CODES` constants, positional params matching Foundation API
- Errors barrel (`index.ts`) re-exports `AUTH_ERROR_CODES` and all four error classes
- `AuthenticatedUser` and `AuthSession` aggregate interfaces — match DB schema shapes (user/session) but exclude secrets (`token` not exposed)
- `AuthQueryRepository` interface with `findByEmail`/`findById` methods — pure TypeScript, returns `Promise<DomainResult<AuthenticatedUser | null>>`, null for not-found
- Queries barrel updated to re-export `AuthQueryRepository`

## Task Commits

Each task was committed atomically:

1. **Task 0: Error code constants** — `6433e86` (feat)
2. **Task 1: Domain error classes + barrel** — `968644b` (feat)
3. **Task 2: Aggregate types + barrel** — `9af3693` (feat)
4. **Task 3: AuthQueryRepository + barrel update** — `8d6c0e0` (feat)

**Plan metadata:** pending (committed with this SUMMARY)

## Files Created/Modified

- `src/Modules/Authentication/Domain/Errors/error-codes.constants.ts` — AUTH_ERROR_CODES const object + AuthErrorCode type
- `src/Modules/Authentication/Domain/Errors/user-not-found.error.ts` — UserNotFoundError domain error class
- `src/Modules/Authentication/Domain/Errors/invalid-credentials.error.ts` — InvalidCredentialsError domain error class
- `src/Modules/Authentication/Domain/Errors/email-already-exists.error.ts` — EmailAlreadyExistsError domain error class
- `src/Modules/Authentication/Domain/Errors/authentication-failed.error.ts` — AuthenticationFailedError catch-all fallback
- `src/Modules/Authentication/Domain/Errors/index.ts` — Barrel re-exporting all errors and AUTH_ERROR_CODES
- `src/Modules/Authentication/Domain/Aggregates/authenticated-user.ts` — AuthenticatedUser + AuthSession interfaces
- `src/Modules/Authentication/Domain/Aggregates/index.ts` — Barrel re-exporting both aggregate types
- `src/Modules/Authentication/Domain/Repositories/Queries/auth-query.repository.ts` — AuthQueryRepository interface contract
- `src/Modules/Authentication/Domain/Repositories/Queries/index.ts` — Updated barrel with AuthQueryRepository type export

## Decisions Made

- **AUTH_ERROR_CODES as const**: Following the Foundation ErrorCodes pattern — const objects with `as const` for literal type inference, plus a union type helper. Avoids hardcoded strings in domain errors.
- **Null for not-found**: Repository query methods return `AuthenticatedUser | null` — a query that finds nothing is a successful result, not an error condition.
- **Token excluded from AuthSession**: The `token` field exists in the DB session schema but is excluded from the domain aggregate — BetterAuth manages tokens internally.
- **No UserAggregateCreateInput**: Sign-up input is handled by Application-layer DTOs, not domain aggregates.
- **Pure TypeScript interfaces**: Repository contracts have no InversifyJS decorators or `I` prefix — bound via `Symbol.for('Auth.AuthQueryRepository')` in ContainerModule (deferred to 08-06).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Threat Surface Scan

No new threat surface introduced beyond what the plan's threat model documents. Repository interfaces are pure contracts with no implementation; domain errors extend Foundation classes with no new external dependencies.

## Self-Check

- [x] All 10 files exist on disk
- [x] 4 commits across 4 tasks
- [x] `npx tsc --noEmit` passes (zero errors)
- [x] All acceptance criteria met per task

## Self-Check: PASSED

## Next Phase Readiness

- Domain layer contracts complete — ready for 08-05 (Application UseCases with @injectable() + @inject())
- AuthQueryRepository will be bound to Drizzle implementation in 08-06
- Error classes ready for Application-layer mapper (mapDomainToAppError already exists in Foundations)

---

*Phase: 08-module-integration-server-actions*
*Completed: 2026-06-25*
