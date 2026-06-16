# Phase 5: Infrastructure Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 05-infrastructure-layer
**Areas discussed:** InfrastructureError fields, Sanitization strategy, Resilience API design, Mapper direction & shape, Specific error organization, InfrastructureResult shape, Barrel structure, Validator & type guard

---

## InfrastructureError Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse cause | Use inherited `cause?: ErrorBase` — no separate `technicalCause` | ✓ |
| Separate technicalCause | Keep `technicalCause?: unknown` distinct from `cause?: ErrorBase` | |
| RetryCount: Required | `retryCount: number` — 0 when no retry | |
| RetryCount: Optional | `retryCount?: number` — undefined when not applicable | ✓ |
| Component: Free string | `systemComponent: string` | |
| Component: Enum (Recommended) | `systemComponent: InfrastructureComponent` union type | ✓ |
| Strategy: String only | `retryStrategy?: string` | |
| Strategy: String union (Recommended) | `retryStrategy?: InfrastructureRetryStrategy` union | ✓ |
| Strategy: Object with config | Full strategy config object | |
| safeDetails: Optional Record | `safeDetails?: Record<string, unknown>` | ✓ |
| safeDetails: Optional string | `safeDetails?: string` | |
| safeDetails: Drop | Omit entirely, only `message` carries sanitized info | |
| Constructor: All-in-one | Everything in one params object | ✓ |
| Constructor: Split | Required first, optional separate | |
| Message: Carries sanitized | `message` is the sanitized safe string | |
| Message: Technical (Recommended) | `message` is technical, only `safeDetails` crosses boundary | ✓ |
| Types: In Kernel | Define in Kernel/Primitives/ | |
| Types: In Infra (Recommended) | Define in Infrastructure/Contracts/ | ✓ |
| Layer: Hardcode (Recommended) | Pass `LayerType.INFRASTRUCTURE` to `super()` | ✓ |
| Layer: Allow override | Accept `layer` in named params | |
| isRecoverable: true (Recommended) | Default `true` — infra errors are often retryable | ✓ |
| isRecoverable: false | Default `false` — same as ErrorBase | |

**User's choice:** All selections as marked above
**Notes:** Optional fields pattern matches ApplicationError. Union types in Contracts/ follow DomainErrorContract pattern.

## Sanitization Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Mapper-level (Recommended) | Standalone `sanitizeInfraError()` called by mapper | ✓ |
| Method on Error | `toSafeJSON()` on InfrastructureError | |
| Constructor-level | Sanitization at construction time | |
| Hostnames + stacks only (Recommended) | Strip hostnames and full stack traces | ✓ |
| Hostnames + stacks + query params | Also strip URL query params/API keys | |
| Opt-out — sanitized by default (Recommended) | Default sanitized, flag to override | ✓ |
| Opt-in — unsanitized by default | Only sanitized when explicitly requested | |

**User's choice:** All selections as marked above
**Notes:** Clean separation — Error class stays technical, mapper handles safety.

## Resilience API Design

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone wrappers (Recommended) | Functions that wrap operations, return InfrastructureResult | ✓ |
| Instance methods | Methods on a ResilientInfrastructureResult class | |
| Exponential with jitter (Recommended) | `baseDelay * 2^attempt + random(0, jitterMax)` | ✓ |
| Fixed delay | `baseDelay` between each retry | |
| Exponential (no jitter) | `baseDelay * 2^attempt` | |
| Simple: (fn, maxRetries, options?) (Recommended) | Clean signature with obvious defaults | ✓ |
| Options object | Full config in options | |
| Timeout: Function wrapper (Recommended) | `withTimeout(fn, ms)` — promise race | ✓ |
| Timeout: Option on withRetry | Add `timeoutMs` to RetryOptions | |
| Fallback: Transform (Recommended) | `withFallback(result, fallback: T)` | ✓ |
| Fallback: Factory | `withFallback(result, fallbackFn)` — depends on error | |
| Circuit breaker: Defer (Recommended) | Defer to follow-up phase/spike | ✓ |
| Circuit breaker: Simple version now | Basic in-memory stateful wrapper | |

**User's choice:** All selections as marked above
**Notes:** Circuit breaker deferred with strong rationale — naive in-memory implementation without proper Closed/Open/Half-Open state management is dangerous.

## Mapper Direction & Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Infra→App upward (Recommended) | Convert InfrastructureError → ApplicationError, rename file | ✓ |
| App→Infra downward | Convert ApplicationError → InfrastructureError | |
| Both directions, two files | Keep scaffold + add new Infra→App mapper | |
| Generic single mapper (Recommended) | `mapInfrastructureToAppError(infraError, params): ApplicationError` | ✓ |
| Per-subclass mapper | Separate mappers for each category | |

**User's choice:** All selections as marked above
**Notes:** Rename scaffold file to `infrastructure-to-application-error.mapper.ts`. Same pattern as Phase 4 Domain→App mapper.

## Specific Error Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Flatten to Specific/ (Recommended) | Remove subdirectories, match Phase 3/4 pattern | ✓ |
| Keep subdirectories | Keep DatabaseErrors/, NetworkErrors/, CacheErrors/ | |
| Remove Specific/ level | Put errors directly in Errors/Category/ | |
| All 5 (Recommended) | Keep all scaffolded errors flat | ✓ |
| Core 3 only | Drop query-specific and unavailable-specific | |

**User's choice:** All selections as marked above
**Notes:** Flat Specific/ directory consistent with Phase 3 D-10 and Phase 4 D-27.

## InfrastructureResult Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Pure type alias — delete stubs (Recommended) | `type InfrastructureResult<T> = ResultBase<T, InfrastructureError>` | ✓ |
| Keep some stubs | Keep .type-guard.ts, delete .contract.ts and .validator.ts | |

**User's choice:** Pure type alias — delete stubs
**Notes:** Matches Phase 4 D-11/D-12 exactly.

## Barrel Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Follow Phase 4 pattern (Recommended) | Contracts/, Errors/, Mappers/, Results/ | ✓ |
| Add Resilience/ subdirectory | For standalone resilience wrappers | (implicitly accepted via D-20) |

**User's choice:** Follow Phase 4 pattern
**Notes:** Resilience wrappers get a separate Resilience/ subdirectory since they don't fit in Contracts/Errors/Mappers/Results.

## Validator & Type Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Standard pattern only (Recommended) | Validate layer === INFRASTRUCTURE, duck-type systemComponent | ✓ |
| Add extra checks | Also validate retryCount non-negative, safeDetails exists if sanitized | |

**User's choice:** Standard pattern only
**Notes:** Follows Phase 3/4 pattern exactly.

---

## the agent's Discretion
- Exact order of named params in constructor params object (beyond code, message, systemComponent)
- Internal helper utilities shared between InfrastructureErrorValidator and isInfrastructureError
- Validation error message formatting in InfrastructureErrorValidator
- Barrel export order within subdirectory index.ts files
- Resilient wrappers' RetryOptions exact shape
- Whether Resilience/ functions are exported as named exports or grouped under a namespace

## Deferred Ideas
- Circuit breaker - follow-up phase or dedicated spike
- Module-specific repository implementations - module phases
- Cross-layer mappers beyond Infrastructure→Application - later phases
- Observability infrastructure - provided at architectural boundaries by consumers
- Full testing - per PROJECT.md
