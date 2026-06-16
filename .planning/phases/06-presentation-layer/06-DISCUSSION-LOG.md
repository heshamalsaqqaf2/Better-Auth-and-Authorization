# Phase 6: Presentation Layer — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 06-presentation-layer
**Areas discussed:** DU variant shapes, PresentationResult metadata, Mapper variant detection, Mapper fallback, User message strategy, Factory functions, Type narrowing helpers, Scaffold cleanup, NetworkError shape, Validation/NotFound boundary, Single vs two mappers, Mapper error safety, ErrorCode on variants, Specific/ file organization

---

## DU Variant Shapes

### Q-01: ValidationError fieldErrors type

| Option | Description | Selected |
|--------|-------------|----------|
| Record<string, string[]> (Recommended) | Matches Application layer's CommandValidationError. Richer validation feedback | ✓ |
| Record<string, string> | Matches Base_System.md spec exactly. Simpler for UI rendering | |

**User's choice:** Record<string, string[]>
**Notes:** Consistency with Application layer. UI handles arrays via join, list, or first-item display.

### Q-02: SystemError.severity type

| Option | Description | Selected |
|--------|-------------|----------|
| Plain string union (Recommended) | `'warning' \| 'error' \| 'critical'` — 100% serialization-safe | ✓ |
| Template literal from Severity enum | Type-level alignment with Kernel. At runtime still plain strings | |

**User's choice:** Plain string union
**Notes:** Enum values don't survive JSON round-trip reliably across RSC.

### Q-03: NotFoundError suggestedAction

| Option | Description | Selected |
|--------|-------------|----------|
| Optional (Recommended) | `suggestedAction?: string` — matches spec, flexible | ✓ |
| Required | `suggestedAction: string` — always provides action | |

**User's choice:** Optional
**Notes:** Matches Base_System.md. Client handles missing action.

### Q-04: AuthorizationError requiredPermission

| Option | Description | Selected |
|--------|-------------|----------|
| Drop — userMessage only (Recommended) | Security-first: never expose permission structure | ✓ |
| Keep as optional | Enables detailed 'you need X permission' messages | |

**User's choice:** Drop — userMessage only
**Notes:** Permissions structure is not leaked to client. userMessage conveys access denial.

### Q-13: NetworkError variant shape

| Option | Description | Selected |
|--------|-------------|----------|
| Keep minimal (Recommended) | `{ userMessage, retryable }` — matches Base_System.md | ✓ |
| Add statusCode?: number | Enables HTTP-aware error handling | |
| Add statusCode + retryAfter?: number | Full HTTP semantics with countdown UI | |

**User's choice:** Keep minimal
**Notes:** No status code leakage. Client cannot differentiate error subtypes.

### Q-14: ValidationError vs NotFoundError boundary

| Option | Description | Selected |
|--------|-------------|----------|
| NotFoundError by error code prefix (Recommended) | Code starting with NOT_FOUND_* → NotFoundError | ✓ |
| NotFoundError only for explicit 404 semantics | Everything else → SystemError | |
| Merge: ValidationError covers both | One 'input error' path on client | |

**User's choice:** NotFoundError by error code prefix
**Notes:** Clean prefix convention, easy to maintain. Client can distinguish 'not found' from 'invalid input'.

---

## PresentationResult & Metadata

### Q-05: Metadata in v1

| Option | Description | Selected |
|--------|-------------|----------|
| Partial: only operationId (Recommended) | Minimal useful metadata for correlation | ✓ |
| Include full metadata | operationId, duration, timestamp, retryAfter | |
| Omit metadata entirely | Simplest DU, no correlation | |

**User's choice:** Partial: only operationId on both variants
**Notes:** Middle ground. Full metadata deferred to follow-up phase.

### Q-06: operationId type

| Option | Description | Selected |
|--------|-------------|----------|
| Plain string in DU (Recommended) | 100% plain serializable. Branded type lives server-side | ✓ |
| Reuse branded OperationId | Keeps type safety across boundary | |

**User's choice:** Plain string in DU
**Notes:** Clean separation: branded types for server, strings for transport.

---

## Mapper Strategy

### Q-07: Error variant detection

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: instanceof for known, duck-type fallback (Recommended) | Check known classes first, fallback to properties for unknown | ✓ |
| Duck-type on properties only | No class imports, works with any ApplicationError | |
| Exhaustive instanceof check | Precise, couples to every specific error class | |

**User's choice:** Hybrid
**Notes:** Most robust. `AuthorizationFailedError → AuthorizationError`, `CommandValidationError → ValidationError`, others by property detection.

### Q-08: Unexpected ApplicationError fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Map to SystemError (catch-all) (Recommended) | Safe fallback with traceable errorCode | ✓ |
| Log and return generic result | Pure safety, may lose error context | |
| Let mapper throw | Forces handling new error types, risk of production crashes | |

**User's choice:** Map to SystemError (catch-all)
**Notes:** User sees 'Something went wrong' with errorCode. No information leak.

### Q-09: User message strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: auto-generate default + override param (Recommended) | Default sanitized message, allow per-code overrides | ✓ |
| Auto-generate from ApplicationError message | Simplest, requires messages to be user-friendly | |
| Require explicit userMessage mapping | Most verbose, ensures user-friendly output | |

**User's choice:** Hybrid
**Notes:** Minimal boilerplate while allowing customization.

---

## Factory Functions & Helpers

### Q-10: Factory functions for PresentationError

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone factories per variant (Recommended) | e.g., createValidationError(fieldErrors). Tree-shakeable. | ✓ |
| Single factory with discriminated input | createPresentationError({ type, ... }). One import. | |
| No factories — inline object literals | Zero extra code, repetitive | |

**User's choice:** Standalone factories per variant
**Notes:** Follows ok()/err() pattern from Base layer. Each factory importable individually.

### Q-11: Type narrowing helpers

| Option | Description | Selected |
|--------|-------------|----------|
| None — native narrowing sufficient (Recommended) | `if (result._tag === 'Success')` works perfectly | ✓ |
| isSuccess / isFailure guards only | Convenience guards, minimal code | |
| Full match() function for client | result.match({ onSuccess, onFailure }) | |

**User's choice:** None — native narrowing sufficient
**Notes:** Zero extra code, zero runtime overhead.

---

## Mapper Architecture

### Q-15: Single unified vs two separate mappers

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both scaffold files, restructured (Recommended) | Error: AppError→PresError. Result: AppResult→PresResult | ✓ |
| Single: toPresentationResult<T>(appResult, params?) | One function handles both paths | |
| Two separate: error mapper + result wrapper | Separate concerns, testable in isolation | |

**User's choice:** Keep both scaffold files, restructured
**Notes:** Clear separation of concerns. Result mapper calls error mapper internally.

### Q-16: Mapper error handling safety

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: try/catch in result mapper, assertive in error mapper (Recommended) | Result never-throws. Error mapper is pure logic. | ✓ |
| Try/catch → generic SystemError on throw | Never throws, but hides mapper bugs | |
| Let it throw — error boundary catches | Simplest, loses error type info | |

**User's choice:** Hybrid
**Notes:** Result mapper guarantees never-throw at RSC boundary. Error mapper throws on impossible states (defensive).

---

## Client-side Error Monitoring

### Q-17: errorCode on all variants

| Option | Description | Selected |
|--------|-------------|----------|
| Add errorCode to ALL 5 variants (Recommended) | Uniform traceability for monitoring | ✓ |
| Add to AuthorizationError + NetworkError only | Middle ground | |
| Keep errorCode on SystemError only | Matches spec, simpler | |

**User's choice:** Add errorCode to all 5 variants
**Notes:** Enables precise client-side error monitoring for every variant type.

---

## Scaffold Cleanup & File Organization

### Q-12: Scaffold stub files cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Aggressive cleanup — delete all, flatten Specific/ (Recommended) | Delete contract/validator/type-guard stubs. Flatten Specific/ | ✓ |
| Selective — keep type-guards as runtime DU validators | RETAIN type-guards, delete contracts/validators | |
| Minimal — keep stubs, flatten later | Delete only contract files | |

**User's choice:** Aggressive cleanup
**Notes:** Follows Phase 4 D-12 and Phase 5 D-15 deletion pattern.

### Q-18: Specific/ file organization

| Option | Description | Selected |
|--------|-------------|----------|
| Single file: presentation-error.types.ts (Recommended) | All 5 variants + union in one file. Specific/ deleted. | ✓ |
| Flatten: one file per variant | Flat files, barrel re-export | |
| Keep subdirectories, add missing | Retain scaffold structure | |

**User's choice:** Single file in Errors/ root
**Notes:** DUs are a single type — one file, single import.

---

## the agent's Discretion
- Exact order of fields within each DU variant shape
- Exact naming of factory functions (e.g., `createValidationError` vs `validationError`)
- Internal helper utilities shared between mapper functions
- Barrel export order within subdirectory `index.ts` files
- Exact `errorCode` format (e.g., `VALIDATION_EMAIL_INVALID`, `NETWORK_TIMEOUT`)
- Whether factory functions live in `Errors/` or a dedicated `Factories/` subdirectory
- Whether the `userMessage` override parameter is per-mapper-call or per-error-code

## Deferred Ideas
- Full metadata on PresentationResult (duration, timestamp, retryAfter) - follow-up phase
- i18n/locale-aware userMessage system - follow-up phase
- Client-side error UI components (ErrorBoundary, error toasts) - module phases
- Runtime DU validation on client - add if production data shows malformed DUs
- Foundations/index.ts export of Presentation - after Phase 6 is stable
- NetworkError statusCode/retryAfter - add if client needs differentiated UI
- Circuit breaker - follow-up phase or dedicated spike
- Module-specific UseCase or Server Action implementations - module phases
- Full testing - per PROJECT.md
