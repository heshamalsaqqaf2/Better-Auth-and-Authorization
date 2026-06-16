---
phase: 05-infrastructure-layer
plan: 03
subsystem: infra
tags: [error-handling, sanitization, mapper, specific-errors, d-11, d-12, d-13]

requires:
  - phase: 05-infrastructure-layer-02
    provides: InfrastructureError class, InfrastructureComponent, InfrastructureRetryStrategy, InfrastructureErrorContract
  - phase: 04-application-layer
    provides: ApplicationError class, CorrelationId branded type

provides:
  - 5 specific InfrastructureError subclasses (DatabaseConnectionError, DatabaseQueryError, ApiTimeoutError, ApiUnavailableError, CacheUnavailableError)
  - Infrastructure→Application error mapper with sanitization
  - sanitizeInfraError utility with default-on PII stripping

affects: [phase-06-presentation-layer, module-phases]

tech-stack:
  added: []
  patterns:
    - "Specific error subclass pattern: extends parent error with hardcoded code + named params constructor using ConstructorParameters"
    - "Mapper sanitization pattern: sanitizeInfraError called defensively before upward propagation"
    - "Default-on sanitization policy with debug flag opt-out"

key-files:
  created:
    - src/Core/Foundations/Infrastructure/Errors/Specific/database-connection.error.ts
    - src/Core/Foundations/Infrastructure/Errors/Specific/database-query.error.ts
    - src/Core/Foundations/Infrastructure/Errors/Specific/api-timeout.error.ts
    - src/Core/Foundations/Infrastructure/Errors/Specific/api-unavailable.error.ts
    - src/Core/Foundations/Infrastructure/Errors/Specific/cache-unavailable.error.ts
    - src/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper.ts
    - src/Core/Foundations/Infrastructure/Mappers/sanitize-infra-error.ts
  modified:
    - src/Core/Foundations/Infrastructure/Errors/Specific/index.ts
    - src/Core/Foundations/Infrastructure/Mappers/index.ts

key-decisions:
  - "All 5 specific errors follow the same named-params constructor pattern with hardcoded code/systemComponent and conditional optional property assignment"
  - "Database errors (DatabaseConnectionError, DatabaseQueryError) use systemComponent='Database'; API errors use systemComponent='Network'; Cache uses systemComponent='Cache'"
  - "sanitizeInfraError defaults to sanitized mode; debug: true flag provides raw safeDetails (D-13 opt-out)"
  - "Mapper calls sanitizeInfraError defensively before passing InfrastructureError as ApplicationError cause chain"

requirements-completed: [INFO-01, INFO-03]

duration: 3min
completed: 2026-06-16
---

# Phase 05 Plan 03: Specific Infrastructure Errors & Mapper

**Five specific InfrastructureError subclasses (Database/Network/Cache) plus Infrastructure→Application error mapper with default-on sanitization of hostnames, IPs, and stack traces**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-16T20:25:00Z
- **Completed:** 2026-06-16T20:28:27Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- 5 specific InfrastructureError subclasses: DatabaseConnectionError, DatabaseQueryError, ApiTimeoutError, ApiUnavailableError, CacheUnavailableError — each with hardcoded error code string, correct systemComponent value, and named-params constructor following the UseCaseExecutionError pattern
- `Specific/index.ts` barrel re-exports all 5 via named exports
- `mapInfrastructureToAppError(infraError, { operationName, correlationId })` — generic single mapper that calls sanitizeInfraError defensively before wrapping the InfrastructureError as an ApplicationError cause (D-21, D-22, T-05-04)
- `sanitizeInfraError(error, { debug? })` — standalone sanitization utility that recursively strips hostnames (domain-like patterns), IP addresses (IPv4), internal URLs (containing `://`), and stack-trace-like strings from safeDetails; defaults to sanitized mode with debug flag opt-out (D-11, D-12, D-13, T-05-05)
- `Mappers/index.ts` barrel re-exports both mapper and sanitization function

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 5 specific InfrastructureError subclasses and Specific/index.ts barrel** — `632e704` (feat)
2. **Task 2: Create mapper, sanitization function, and Mappers/index.ts barrel** — `6969353` (feat)

## Files Created/Modified

- `src/Core/Foundations/Infrastructure/Errors/Specific/database-connection.error.ts` — DatabaseConnectionError extends InfrastructureError with `DATABASE_CONNECTION_ERROR` code, systemComponent `"Database"`
- `src/Core/Foundations/Infrastructure/Errors/Specific/database-query.error.ts` — DatabaseQueryError extends InfrastructureError with `DATABASE_QUERY_ERROR` code, systemComponent `"Database"`
- `src/Core/Foundations/Infrastructure/Errors/Specific/api-timeout.error.ts` — ApiTimeoutError extends InfrastructureError with `API_TIMEOUT_ERROR` code, systemComponent `"Network"`
- `src/Core/Foundations/Infrastructure/Errors/Specific/api-unavailable.error.ts` — ApiUnavailableError extends InfrastructureError with `API_UNAVAILABLE_ERROR` code, systemComponent `"Network"`
- `src/Core/Foundations/Infrastructure/Errors/Specific/cache-unavailable.error.ts` — CacheUnavailableError extends InfrastructureError with `CACHE_UNAVAILABLE_ERROR` code, systemComponent `"Cache"`
- `src/Core/Foundations/Infrastructure/Errors/Specific/index.ts` — Barrel re-exporting all 5 specific errors via named exports
- `src/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper.ts` — `mapInfrastructureToAppError()` mapping InfrastructureError → ApplicationError with sanitization
- `src/Core/Foundations/Infrastructure/Mappers/sanitize-infra-error.ts` — `sanitizeInfraError()` stripping hostnames, IPs, URLs, and stack traces from safeDetails (default-on, debug flag opt-out)
- `src/Core/Foundations/Infrastructure/Mappers/index.ts` — Barrel re-exporting both mapper and sanitize functions

## Decisions Made

- Followed the UseCaseExecutionError/AuthorizationFailedError pattern from Phase 4 for all 5 specific errors: hardcoded code string, `ConstructorParameters<typeof InfrastructureError>[0]` pattern, conditional assignment for optional properties (`exactOptionalPropertyTypes` compatible)
- Database errors use default message suggestions ("Database connection failed", "Database query execution failed") for ergonomic construction
- Sanitizer uses simple recursive pattern (not a production-grade PII scanner) — pragmatic foundation-layer utility per plan requirement
- Mapper calls sanitizeInfraError defensively during mapping; the sanitized return value is not consumed by ApplicationError (which lacks safeDetails in its contract) — the call ensures the pattern is applied before upward propagation

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- No `typecheck` script in package.json — used `npx tsc --noEmit` directly (passes with zero errors)

## Threat Surface Scan

No new threat surfaces introduced beyond what the plan's threat model covers:

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-05-04 (Information Disclosure — mapper) | Mitigate | sanitizeInfraError called defensively; cause chain preserves InfrastructureError for logging |
| T-05-05 (Information Disclosure — sanitizer) | Mitigate | Default-on sanitization strips hostnames/IPs/stack traces; debug flag required to bypass |
| T-05-06 (Elevation of Privilege — specific errors) | Accept | Specific errors extend InfrastructureError with hardcoded codes only; no new properties |
| T-05-SC (Tampering — package installs) | Accept | Zero external dependencies |

## Self-Check: PASSED

| Check | Status |
|-------|--------|
| 5 specific error files exist with hardcoded codes | ✅ Found all 5 |
| Specific/index.ts re-exports all 5 named | ✅ Named exports |
| mapInfrastructureToAppError calls sanitizeInfraError | ✅ Call in mapper body |
| sanitizeInfraError strips hostnames/IP/stack traces by default | ✅ Regex + recursive scan |
| sanitizeInfraError has debug flag opt-out | ✅ `options?.debug === true` returns raw |
| Mappers/index.ts exports both functions | ✅ Two named exports |
| `npx tsc --noEmit` passes with zero errors | ✅ Zero errors |

## Next Phase Readiness

- Infrastructure Error layer complete: base class, 5 specific subclasses, validator, type guard, result alias, mapper with sanitization
- Ready for Plan 05-04: Resilience wrappers (withRetry, withTimeout, withFallback)
- All 9 output files confirmed present

---

*Phase: 05-infrastructure-layer*
*Completed: 2026-06-16*
