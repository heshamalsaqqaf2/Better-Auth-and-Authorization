# 05-04: Resilience & Barrel

## Objective

Create standalone resilience wrapper functions (withRetry, withTimeout, withFallback) and the top-level Infrastructure barrel, completing the Infrastructure layer's public API surface.

## Tasks

### Task 1: Create Resilience wrapper functions

**Created:**
- `src/Core/Foundations/Infrastructure/Resilience/with-retry.ts` — exponential backoff with jitter (baseDelay * 2^attempt + random jitter), clamped to maxDelayMs, returns InfrastructureResult<T>. Recursive `attempt()` helper. On retry exhaustion, creates InfrastructureError with code RETRY_EXHAUSTED, keeping the last attempt's error as cause.
- `src/Core/Foundations/Infrastructure/Resilience/with-timeout.ts` — Promise.race-based timeout wrapper. Creates InfrastructureError on timeout with code TIMEOUT. Never throws — always returns InfrastructureResult<T>.
- `src/Core/Foundations/Infrastructure/Resilience/with-fallback.ts` — pure synchronous function. If result is Success, returns it unchanged. If Failure, returns `ok(fallback)`.

All wrappers use only native Promise/setTimeout — zero external dependencies.

### Task 2: Create Resilience/index.ts barrel and Infrastructure/index.ts top-level barrel

**Created:**
- `src/Core/Foundations/Infrastructure/Resilience/index.ts` — named exports: withRetry, withTimeout, withFallback, and type export for RetryOptions
- `src/Core/Foundations/Infrastructure/index.ts` — top-level barrel: `export * from` for Contracts, Errors, Mappers, Results, Resilience (5 subdirectories)

## Decisions

- RetryOptions interface defined inline in with-retry.ts per D-05 planner discretion
- withRetry uses `result.error!` non-null assertion for `cause` (safe because isFailure check precedes access; `exactOptionalPropertyTypes` requires it)
- withTimeout uses `async/await` with try/catch to convert timeout Promise rejection to InfrastructureResult Failure
- Infrastructure/index.ts follows Application/index.ts pattern exactly: `export * from "./{subdir}"` in order Contracts → Errors → Mappers → Results → Resilience

## Verification

- `npx tsc --noEmit` — 0 errors
- All 5 files created matching plan specification
- Resilience wrappers use zero external dependencies
- Top-level barrel exports all 5 subdirectories
