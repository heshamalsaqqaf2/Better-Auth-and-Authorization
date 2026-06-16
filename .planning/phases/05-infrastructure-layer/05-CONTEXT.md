# Phase 5: Infrastructure Layer - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 5 delivers:** Resilient I/O error handling — `InfrastructureError` class extending `ErrorBase` with system component context, sanitization, and retry metadata; `InfrastructureResult<T>` type alias constrained to `InfrastructureError`; standalone resilience wrappers (`withRetry`, `withTimeout`, `withFallback`) for safely wrapping external concerns; Infrastructure-to-Application error mapper that sanitizes sensitive details before upward propagation; five concrete specific errors covering Database, Network, and Cache categories.

**What Phase 5 does NOT deliver:**
- Presentation DUs for RSC serialization — Phase 6
- Circuit breaker — deferred to follow-up phase/spike
- Module-specific repository implementations — deferred to module phases
- Tests — deferred (per PROJECT.md)
- Cross-layer mappers beyond Infrastructure→Application — deferred to later phases
- Observability infrastructure (loggers, metric emitters) — provided at architectural boundaries by consumers
</domain>

<decisions>
## Implementation Decisions

### InfrastructureError Class (`Errors/infrastructure-error.ts`)
- **D-01:** Reuse inherited `cause?: ErrorBase` — no separate `technicalCause` field. Matches Phase 3/4 pattern where DomainError and ApplicationError both use `cause`.
- **D-02:** `retryCount?: number` — optional, undefined when no retries occurred. Matches `userId?: string` in ApplicationError (optional = not applicable).
- **D-03:** `systemComponent: InfrastructureComponent` — typed union type (`'Database' | 'Network' | 'Cache'`), defined in `Infrastructure/Contracts/` alongside the contract interface. Controlled vocabulary prevents typos and enables exhaustive matching.
- **D-04:** `retryStrategy?: InfrastructureRetryStrategy` — typed string union (`'exponential' | 'fixed' | 'jitter'`), defined in `Infrastructure/Contracts/`. Controlled vocabulary, enables downstream matching.
- **D-05:** `safeDetails?: Record<string, unknown>` — optional key-value pairs for sanitized structured data safe for upward propagation.
- **D-06:** All-in-one named params constructor: `constructor({ code, message, systemComponent, retryCount?, retryStrategy?, safeDetails?, cause? })` — matches ApplicationError pattern (Phase 4 D-02).
- **D-07:** `message` is technical (log-friendly). Only `safeDetails` crosses the Application boundary. Separates logging concern from propagation concern.
- **D-08:** `layer` hardcoded to `LayerType.INFRASTRUCTURE` passed to `super()`. Matches DomainError (Phase 3 D-03) and ApplicationError (Phase 4 D-08) — layer is non-negotiable.
- **D-09:** `isRecoverable()` default returns `true` — infrastructure errors (DB timeout, network blip) are often retryable. Subclasses override to `false` for non-recoverable errors.

### Contract Interface (`Contracts/infrastructure-error.contract.ts`)
- **D-10:** Keep `infrastructure-error.contract.ts` — defines `InfrastructureErrorContract` interface extending `ErrorBase` with `systemComponent`, `retryCount?`, `retryStrategy?`, `safeDetails?`. `InfrastructureError` class implements this interface.

### Sanitization Strategy
- **D-11:** Sanitization happens at mapper level — standalone `sanitizeInfraError(error): SafeInfraErrorData` function called by the Infrastructure→Application mapper before wrapping as `cause`. Error class stays technical, mapper handles safety.
- **D-12:** Strips hostnames (IP/internal URLs) and full stack traces. Connection strings are never stored (they come from `cause` which is the DB driver error).
- **D-13:** Opt-out policy — sanitized by default. Explicit flag to override for debug/dev mode.

### InfrastructureResult (`Results/infrastructure-result.ts`)
- **D-14:** Pure type alias: `type InfrastructureResult<T> = ResultBase<T, InfrastructureError>`. No class, no subclass. Matches Phase 4 D-11.
- **D-15:** **DELETE** scaffold stubs: `infrastructure-result.contract.ts`, `infrastructure-result.validator.ts`, `infrastructure-result.type-guard.ts`. (Matches Phase 4 D-12.)
- **D-16:** No method overrides on `tap()`/`tapError()`. No auto-logging. Resilience is handled by standalone wrappers, not result instance methods.

### Resilience API (`Resilience/` — standalone wrapper functions)
- **D-17:** Standalone wrapper functions (not instance methods on InfrastructureResult):
  - `withRetry<T>(fn: () => Promise<InfrastructureResult<T>>, maxRetries: number, options?: RetryOptions): Promise<InfrastructureResult<T>>` — simple signature with obvious defaults.
  - `withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<InfrastructureResult<T>>` — wraps with promise race; returns `err(InfrastructureError)` on timeout. Composable with `withRetry`.
  - `withFallback<T>(result: InfrastructureResult<T>, fallback: T): InfrastructureResult<T>` — on Failure, returns `ok(fallback)`. Simple transform function.
- **D-18:** Default retry backoff: exponential with jitter — `baseDelay * 2^attempt + random(0, jitterMax)`. Industry standard, prevents thundering herd.
- **D-19:** Circuit breaker deferred to a follow-up phase/spike — NOT implemented in Phase 5. A naive in-memory circuit breaker without proper state management (Closed/Open/Half-Open) is dangerous and can cause permanent lockouts.
- **D-20:** Resilience wrappers live in a `Resilience/` subdirectory under Infrastructure (alongside Contracts/, Errors/, Mappers/, Results/).

### InfrastructureError Mapper (`Mappers/`)
- **D-21:** Direction: Infrastructure→Application (upward). Rename scaffold file from `application-to-infrastructure-error.mapper.ts` to `infrastructure-to-application-error.mapper.ts`.
- **D-22:** Generic single mapper: `mapInfrastructureToAppError(infraError: InfrastructureError, params: { operationName: string; correlationId: CorrelationId }): ApplicationError`. Same pattern as Phase 4 D-23/D-24 — single function wraps any InfrastructureError as cause of an ApplicationError.

### Specific Error Organization (`Errors/Specific/`)
- **D-23:** Flatten to `Errors/Specific/` — remove category subdirectories (DatabaseErrors/, NetworkErrors/, CacheErrors/). Matches Phase 3 D-10 and Phase 4 D-27.
- **D-24:** All 5 specific errors survive flattening:
  - `database-connection.error.ts` — Database connection failures
  - `database-query.error.ts` — Query execution failures
  - `api-timeout.error.ts` — External API timeout
  - `api-unavailable.error.ts` — External API unavailable
  - `cache-unavailable.error.ts` — Cache service unavailable
- **D-25:** Single `Errors/Specific/index.ts` barrel re-exporting all five.

### Validator & Type Guard (`Errors/`)
- **D-26:** Standard pattern — no infra-specific extra checks beyond the Phase 3/4 baseline.
- **D-27:** `InfrastructureErrorValidator` implementing `ErrorValidator<InfrastructureErrorContract>` — validates `layer === LayerType.INFRASTRUCTURE` and `systemComponent` is a non-empty string.
- **D-28:** `isInfrastructureError()` — duck-type check for `systemComponent` (string) property. Follows Phase 2/3 duck-typing pattern.

### Barrel Structure
- **D-29:** Top-level subdirectories: `Contracts/`, `Errors/`, `Mappers/`, `Results/`, `Resilience/`. Each with `index.ts` barrel. Re-exported from `Infrastructure/index.ts`.
- **D-30:** `Contracts/` populated with: `infrastructure-error.contract.ts` (InfrastructureErrorContract), component/strategy type definitions (`infrastructure-component.type.ts`, `infrastructure-retry-strategy.type.ts`), `index.ts` barrel.
- **D-31:** `Infrastructure/index.ts` re-exports all subdirectories. Follows Phase 2 D-29..D-31 barrel chain pattern.

### Architecture Constraints (carried from prior phases)
- Zero external dependencies for Foundation layers (resilience wrappers use native `Promise`/`setTimeout` only)
- Import boundary: Infrastructure imports from Application + Domain + Kernel + Base
- Duck typing for validators and type guards (no `instanceof`)
- ES2022+ target
- Barrel chain: each subdirectory `index.ts` → `Infrastructure/index.ts`

### the agent's Discretion
- Exact order of named params in constructor params object (beyond `code`, `message`, `systemComponent`)
- Internal helper utilities shared between InfrastructureErrorValidator and isInfrastructureError
- Validation error message formatting in InfrastructureErrorValidator
- Barrel export order within subdirectory `index.ts` files
- Resilient wrappers' `RetryOptions` exact shape (type for baseDelayMs, maxDelayMs, jitterFactor)
- Whether Resilience/ functions are exported as named exports or grouped under a namespace
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, OOP for Infrastructure layer, dependency directions, data flow, return type conformance
- `docs/Base_System.md` §2.2 — InfrastructureError specification (technicalCause, retryCount, systemComponent, safeDetails, retryStrategy); §3.2 — InfrastructureResult specification (retry, timeout, circuit-breaker, fallback); §4 — Cross-layer transformation strategy; §7 — File structure
- `.planning/codebase/ARCHITECTURE.md` — Existing architecture audit, Infrastructure layer responsibilities, import boundaries, Data Flow §5, existing scaffold file list
- `.planning/codebase/STACK.md` — External dependencies available (pg, drizzle-orm); determines what resilience wrappers need to work with

### Phase 4 — Application Layer (mapper output / dependency target)
- `src/Core/Foundations/Application/Errors/application-error.ts` — ApplicationError class (what mapper creates as output)
- `src/Core/Foundations/Application/Contracts/request-context.contract.ts` — RequestContext interface (mapper uses for params)
- `src/Core/Foundations/Application/Mappers/domain-to-application-error.mapper.ts` — Reference for mapper pattern
- `.planning/phases/04-application-layer/04-CONTEXT.md` — Phase 4 decisions (especially D-01: cause wraps any ErrorBase, D-17/D-18 CQRS handler interfaces)

### Base Layer (classes InfrastructureError extends / InfrastructureResult uses)
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — ErrorBase abstract class (isRecoverable default false, getSeverity default ERROR, toJSON with circularity)
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — ResultBase abstract class + Success/Failure + ok/err
- `src/Core/Foundations/Base/Validators/base-error.validator.ts` — Reference for validator pattern

### Kernel Contracts (contracts InfrastructureError implements)
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ErrorBase interface (code, message, timestamp, layer, cause, toJSON, isRecoverable, getSeverity)
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts` — ResultBase<T, E> interface
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — ErrorValidator interface
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType enum (LayerType.INFRASTRUCTURE used in InfrastructureError)
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` — CorrelationId branded type (used in mapper params)

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria, requirements (INFO-01, INFO-02, INFO-03)
- `.planning/REQUIREMENTS.md` — Requirement IDs and traceability
- `.planning/STATE.md` — Current position, accumulated decisions
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/phases/04-application-layer/04-CONTEXT.md` — Phase 4 decisions (D-01..D-33), mapper reference pattern
- `.planning/phases/03-domain-layer/03-CONTEXT.md` — Phase 3 decisions (D-01..D-19), validator/type-guard patterns
- `.planning/phases/02-foundations-base-layer/02-CONTEXT.md` — Phase 2 decisions (D-01..D-31), barrel chain, duck typing

### Source Scaffold Files (to be modified/implemented)
- `src/Core/Foundations/Infrastructure/index.ts` — Target: top-level barrel
- `src/Core/Foundations/Infrastructure/Contracts/infrastructure-error.contract.ts` — Target: InfrastructureErrorContract interface
- `src/Core/Foundations/Infrastructure/Contracts/infrastructure-component.type.ts` — Target: InfrastructureComponent union type
- `src/Core/Foundations/Infrastructure/Contracts/infrastructure-retry-strategy.type.ts` — Target: InfrastructureRetryStrategy union type
- `src/Core/Foundations/Infrastructure/Contracts/index.ts` — Target: barrel
- `src/Core/Foundations/Infrastructure/Errors/infrastructure-error.ts` — Target: InfrastructureError class
- `src/Core/Foundations/Infrastructure/Errors/infrastructure-error.validator.ts` — Target: InfrastructureErrorValidator
- `src/Core/Foundations/Infrastructure/Errors/infrastructure-error.type-guard.ts` — Target: isInfrastructureError type guard
- `src/Core/Foundations/Infrastructure/Errors/index.ts` — Target: errors barrel
- `src/Core/Foundations/Infrastructure/Errors/Specific/database-connection.error.ts` — Target: DatabaseConnectionError
- `src/Core/Foundations/Infrastructure/Errors/Specific/database-query.error.ts` — Target: DatabaseQueryError
- `src/Core/Foundations/Infrastructure/Errors/Specific/api-timeout.error.ts` — Target: ApiTimeoutError
- `src/Core/Foundations/Infrastructure/Errors/Specific/api-unavailable.error.ts` — Target: ApiUnavailableError
- `src/Core/Foundations/Infrastructure/Errors/Specific/cache-unavailable.error.ts` — Target: CacheUnavailableError
- `src/Core/Foundations/Infrastructure/Errors/Specific/index.ts` — Target: specific errors barrel
- `src/Core/Foundations/Infrastructure/Results/infrastructure-result.ts` — Target: InfrastructureResult type alias
- `src/Core/Foundations/Infrastructure/Results/index.ts` — Target: results barrel
- `src/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper.ts` — Renamed from `application-to-infrastructure-error.mapper.ts` — Target: generic mapper
- `src/Core/Foundations/Infrastructure/Mappers/sanitize-infra-error.ts` — Target: sanitization utility
- `src/Core/Foundations/Infrastructure/Mappers/index.ts` — Target: mappers barrel
- `src/Core/Foundations/Infrastructure/Resilience/with-retry.ts` — Target: withRetry wrapper
- `src/Core/Foundations/Infrastructure/Resilience/with-timeout.ts` — Target: withTimeout wrapper
- `src/Core/Foundations/Infrastructure/Resilience/with-fallback.ts` — Target: withFallback wrapper
- `src/Core/Foundations/Infrastructure/Resilience/index.ts` — Target: resilience barrel

### Files to DELETE (stubs that contradict pure type alias decision)
- `src/Core/Foundations/Infrastructure/Results/infrastructure-result.contract.ts` — DELETE
- `src/Core/Foundations/Infrastructure/Results/infrastructure-result.validator.ts` — DELETE
- `src/Core/Foundations/Infrastructure/Results/infrastructure-result.type-guard.ts` — DELETE
- `src/Core/Foundations/Infrastructure/Mappers/application-to-infrastructure-error.mapper.ts` — DELETE (replaced by renamed version)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ErrorBase abstract class** (`Base/Abstracts/error-base.ts`) — InfrastructureError directly extends this; inherits `toJSON()` with circularity tracking, `isRecoverable()` default
- **Success/Failure + ok/err** (`Base/Abstracts/result-base.ts`) — InfrastructureResult type alias reuses these directly; no new monadic implementations needed
- **ApplicationError class + Domain→App mapper** (`Application/Errors/application-error.ts`, `Application/Mappers/domain-to-application-error.mapper.ts`) — Reference for Infrastructure→App mapper pattern
- **BaseErrorValidator** (`Base/Validators/base-error.validator.ts`) — Reference for InfrastructureErrorValidator pattern
- **CorrelationId branded type + factory** (`Kernel/Primitives/Types/correlation-id.type.ts`) — Used in mapper params
- **4 scaffold subdirectories** (`Contracts/`, `Errors/`, `Mappers/`, `Results/`) already exist with stub files — ready to implement

### Established Patterns
- **Duck typing for validation** — Property-based structural checks, no instanceof (Phase 2 D-20)
- **Barrel chain** — Subdirectory index.ts → parent index.ts (Phase 2 D-29..D-31)
- **As const enums** — LayerType and Severity values from Kernel
- **Unique-symbol branding** — Branded types pattern from Phase 1
- **File naming** — `*.contract.ts`, `*.type-guard.ts`, `*.validator.ts`, `*.error.ts` conventions
- **ErrorBase `cause` chain** — Set-based circularity tracking via toJSON()
- **Named params constructor** — All error classes follow `constructor({ code, message, ... })` pattern (Phase 2+)

### Integration Points
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — InfrastructureError `extends` this class
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — InfrastructureResult type alias references ResultBase<T, E>
- `src/Core/Foundations/Application/Errors/application-error.ts` — Mapper produces ApplicationError instances
- `src/Core/Foundations/Application/Contracts/request-context.contract.ts` — Mapper uses RequestContext for params
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — InfrastructureErrorContract extends this
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType.INFRASTRUCTURE used in constructor
- `src/Core/Foundations/Infrastructure/index.ts` — Top-level barrel to expose to consumers
</code_context>

<specifics>
## Specific Ideas

- `systemComponent: InfrastructureComponent` union: `'Database' | 'Network' | 'Cache'` — defined in Contracts/
- `retryStrategy?: InfrastructureRetryStrategy` union: `'exponential' | 'fixed' | 'jitter'` — defined in Contracts/
- InfrastructureError constructor: `constructor({ code, message, systemComponent, retryCount?, retryStrategy?, safeDetails?, cause? })` — named params object
- `layer` hardcoded to `LayerType.INFRASTRUCTURE` passed to `super()`
- `isRecoverable()` default returns `true`
- InfrastructureError `extends ErrorBase implements InfrastructureErrorContract`
- `InfrastructureResult<T>` is simply `type InfrastructureResult<T> = ResultBase<T, InfrastructureError>` — no class, no contract file
- `mapInfrastructureToAppError(infraError, { operationName, correlationId })` — creates ApplicationError with infraError as cause
- `sanitizeInfraError(error)` — strips hostnames, stack traces before wrapping
- `withRetry(fn, maxRetries, { baseDelayMs?, maxDelayMs?, jitterFactor? })` — exponential backoff with jitter
- `withTimeout(fn, ms)` — Promise.race with timeout rejection
- `withFallback(result, fallback)` — convert Failure to Success with fallback value
- Circuit breaker — NOT in Phase 5; deferred to follow-up phase/spike
- Flat `Specific/` directory — remove subdirectories consistent with Phase 3 D-10 and Phase 4 D-27
- New `Resilience/` subdirectory alongside Contracts/, Errors/, Mappers/, Results/
- `Infrastructure/index.ts` barrel re-exports all five subdirectories
</specifics>

<deferred>
## Deferred Ideas

- **Circuit breaker** — Complex stateful resilience pattern. Deferred to a follow-up phase or dedicated spike. Phase 5 delivers withRetry, withTimeout, withFallback as the 80/20 of resilience.
- Module-specific repository implementations — module phases
- Cross-layer mappers beyond Infrastructure→Application — later phases
- Observability infrastructure (structured logger, metric emitter) — provided at architectural boundaries by consumers
- Full testing — per PROJECT.md

### Reviewed Todos (not folded)
None — no pending todos matched Phase 5 scope.

</deferred>

---

*Phase: 05-infrastructure-layer*
*Context gathered: 2026-06-16*
