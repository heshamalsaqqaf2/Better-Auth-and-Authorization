# Phase 6: Presentation Layer — Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 6 delivers:** Serialization-safe discriminated unions for RSC transport — `PresentationError` (5-variant DU with `_tag` discriminant), `PresentationResult<T>` (plain-object DU with `_tag: 'Success' | 'Failure'`), standalone factory functions per error variant, Application-to-Presentation mappers (error + result), and a safety layer that prevents crashes at the server/client boundary.

**What Phase 6 does NOT deliver:**
- Client-side error components/hooks — deferred to module phases
- i18n/locale-aware userMessage system — deferred to follow-up phase
- Metadata beyond `operationId` (no duration, no retryAfter) — deferred
- Circuit breaker — Phase 5 deferred item, not in Phase 6
- Tests — deferred (per PROJECT.md)
- Module-specific UseCase or Server Action implementations — deferred to module phases
- Observability infrastructure (loggers, metric emitters on client) — provided at architectural boundaries by consumers
</domain>

<decisions>
## Implementation Decisions

### PresentationError DU Shape

- **D-01:** `fieldErrors` type is `Record<string, string[]>` — matches Application layer's `CommandValidationError` type. UI handles arrays (join, list, or show first). More flexible — doesn't lose data at the boundary.
- **D-02:** `severity` in `SystemError` is a plain string union `'warning' | 'error' | 'critical'` — not the Kernel `Severity` enum. 100% serialization-safe across RSC. Enum values don't survive JSON round-trip reliably.
- **D-03:** `suggestedAction` in `NotFoundError` is optional (`suggestedAction?: string`) — matches `Base_System.md` spec. Client handles missing action gracefully.
- **D-04:** `requiredPermission` is **dropped** from `AuthorizationError` — security-first: never expose permission structure to the client. `userMessage` conveys access denial generically.
- **D-05:** `NetworkError` keeps minimal shape: `{ _tag: 'NetworkError'; userMessage: string; retryable: boolean }` — no `statusCode`, no `retryAfter`. Matches `Base_System.md` spec. Client cannot differentiate HTTP error subtypes.
- **D-06:** `errorCode: string` added to **all 5 variants** — enables precise client-side error monitoring. Without codes, monitoring cannot distinguish e.g., `ValidationError: email invalid` from `ValidationError: password too short`. Uniform traceability across all variants.

### PresentationResult Shape

- **D-07:** Metadata is **partial v1**: only `operationId: string` on both Success and Failure variants. No `duration`, no `timestamp`, no `retryAfter`. Minimal useful metadata for correlation; added in follow-up if needed.
- **D-08:** `operationId` type is **plain `string`** in the DU (not the branded `OperationId` type from Kernel). The DU stays 100% plain serializable. The Server Action or mapper generates an `OperationId` as branded type, then converts to string for the DU.

### Factory Functions

- **D-09:** **Standalone factory functions per variant** — e.g., `createValidationError(fieldErrors)`, `createNotFoundError(userMessage)`, `createSystemError(params)`, etc. Type-safe, tree-shakeable (each importable individually), follows the `ok()`/`err()` pattern from `Base` layer.

### Type Narrowing Helpers

- **D-10:** **No narrowing helpers** — native TypeScript narrowing (`if (result._tag === 'Success')`) is sufficient. No `isSuccess`, `isFailure`, or `match()` function. Zero extra code, zero runtime overhead.

### Error Variant Detection (Mapper)

- **D-11:** **Hybrid approach**: `instanceof` for known ApplicationError subclasses (`AuthorizationFailedError` → `AuthorizationError`, `CommandValidationError` → `ValidationError`), duck-type fallback on properties for unrecognized types. Most robust — checks known classes first, falls back to property detection for custom or module-specific errors.

### Fallback for Unexpected Errors

- **D-12:** **Map to `SystemError`** (catch-all) — safe fallback. User sees a generic message with a traceable `errorCode`. No information leak, no production crash.

### User Message Strategy

- **D-13:** **Hybrid**: auto-generate `userMessage` from sanitized `ApplicationError.message` by default. Accept an optional override parameter for per-code or per-domain custom messages. Minimal boilerplate while allowing customization.

### Mapper Architecture

- **D-14:** **Keep both scaffold files with restructured responsibility**:
  - `application-to-presentation-error.mapper.ts`: Maps `ApplicationError` → `PresentationError` (pure error-type transform)
  - `application-to-presentation-result.mapper.ts`: Wraps `ApplicationResult<T>` → `PresentationResult<T>` (unwraps `isSuccess`/`isFailure`, calls error mapper internally)
  - Clear separation of concerns. Two imports, two testable units.

### Mapper Error Handling Safety

- **D-15:** **Hybrid safety**: The result mapper (`ApplicationResult → PresentationResult`) wraps the entire body in a try/catch — guarantees never-throw contract. The error mapper (`ApplicationError → PresentationError`) is pure logic and throws on impossible states (defensive programming — these should never happen in production). This ensures the RSC boundary is never crossed by a thrown error.

### Scaffold Cleanup

- **D-16:** **Aggressive cleanup** — delete all OOP-style stubs that don't apply to DUs (following Phase 4 D-12 and Phase 5 D-15 pattern):
  - DELETE: `presentation-error.contract.ts`, `presentation-error.validator.ts`, `presentation-error.type-guard.ts`
  - DELETE: `presentation-result.contract.ts`, `presentation-result.validator.ts`, `presentation-result.type-guard.ts`
  - DELETE: all 3 `Specific/` category subdirectories (`Validation-Ui-Errors/`, `Network-Ui-Errors/`, `System-Ui-Errors/`)
  - CREATE: `presentation-error.types.ts` in `Errors/` root — single file containing all 5 variant types + `PresentationError` union
  - CREATE: `Presentation/index.ts` — barrel re-exporting `Errors`, `Results`, `Mappers`

### ValidationError vs NotFoundError Boundary

- **D-17:** **`NotFoundError` by error code prefix** — errors whose `code` starts with `NOT_FOUND_` (e.g., `NOT_FOUND_USER`, `NOT_FOUND_COMPLAINT`) map to `NotFoundError`. All other input-type ApplicationErrors map to `ValidationError` or the appropriate variant. Clean prefix convention, easy to maintain.

### File Organization

- **D-18:** **Single file** `Errors/presentation-error.types.ts` — all 5 variant types + the `PresentationError` discriminated union in one file. Single import. `Specific/` directory deleted entirely. Matches "it's one DU" philosophy.

### Architecture Constraints (carried from prior phases)
- Zero external dependencies for Foundation layers — pure TypeScript only
- Import boundary: Presentation imports from Application + Kernel only (no Domain, Infrastructure)
- Duck typing for validators and type guards (no `instanceof`)
- ES2022+ target
- Barrel chain: each subdirectory `index.ts` → `Presentation/index.ts`

### the agent's Discretion
- Exact order of fields within each DU variant shape
- Exact naming of factory functions (e.g., `createValidationError` vs `validationError`)
- Internal helper utilities shared between mapper functions
- Barrel export order within subdirectory `index.ts` files
- Exact `errorCode` format (e.g., `VALIDATION_EMAIL_INVALID`, `NETWORK_TIMEOUT`, etc.)
- Whether factory functions live in `Errors/` or a dedicated `Factories/` subdirectory
- Whether the `userMessage` override parameter is per-mapper-call or per-error-code
</decisions>

<specifics>
## Specific Ideas

- `PresentationError` DU follows Base_System.md §2.2 with modifications per D-01 through D-06
- `PresentationResult<T>` DU follows Base_System.md §3.2 with modifications per D-07 and D-08
- Factory functions follow `ok()`/`err()` standalone function pattern from `Base/Abstracts/result-base.ts`
- `errorCode` format follows Kernel's `ErrorCode` branded type convention (uppercase snake_case)
- Mapper files from scaffold remain but are restructured — not deleted
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, DU for Presentation layer, import boundaries, data flow, serialization boundary rule
- `docs/Base_System.md` §2.2 — PresentationError DU spec (5 variants, shape, strict rules); §3.2 — PresentationResult DU spec (Success/Failure, metadata); §4 — Cross-layer transformation strategy; §5 — Import boundaries; §7 — File structure
- `.planning/codebase/ARCHITECTURE.md` — Existing architecture audit, Presentation layer responsibilities, import boundaries, Serialization Boundary Rule
- `.planning/codebase/STACK.md` — Technology stack (TypeScript only for Foundation layer, no external deps)
- `.planning/codebase/STRUCTURE.md` — Current file layout for Presentation scaffold

### Phase 5 — Infrastructure Layer (completed, provides context)
- `src/Core/Foundations/Infrastructure/index.ts` — Reference for barrel chain pattern
- `.planning/phases/05-infrastructure-layer/05-CONTEXT.md` — Phase 5 decisions for comparison

### Phase 4 — Application Layer (mapper input / dependency target)
- `src/Core/Foundations/Application/Errors/application-error.ts` — ApplicationError class (what mapper consumes)
- `src/Core/Foundations/Application/Errors/Specific/authorization.error.ts` — AuthorizationFailedError (class detection target)
- `src/Core/Foundations/Application/Errors/Specific/command-validation.error.ts` — CommandValidationError with `fieldErrors: Record<string, string[]>` (matches D-01)
- `src/Core/Foundations/Application/Mappers/domain-to-application-error.mapper.ts` — Reference for mapper pattern
- `.planning/phases/04-application-layer/04-CONTEXT.md` — Phase 4 decisions (especially D-01, D-12 deletion pattern, D-17/D-18 CQRS handlers)

### Phase 2 — Base Layer (factory function pattern reference)
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — ok()/err() standalone function pattern (reference for factory functions D-09)
- `.planning/phases/02-foundations-base-layer/02-CONTEXT.md` — Phase 2 decisions (D-20 duck typing, D-29..D-31 barrel chain)

### Kernel (type references)
- `src/Core/Kernel/Primitives/Types/operation-id.type.ts` — OperationId branded type (used in mapper to generate operationId)
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` — CorrelationId branded type (used in mapper params)
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType enum (LayerType.PRESENTATION for validator if used)

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria (PRES-01, PRES-02, PRES-03)
- `.planning/REQUIREMENTS.md` — Requirement IDs and traceability
- `.planning/STATE.md` — Current position, accumulated decisions
- `.planning/PROJECT.md` — Core value, constraints, key decisions

### Target Scaffold Files (to be implemented/modified)
- `src/Core/Foundations/Presentation/index.ts` — Target: NEW barrel (doesn't exist yet)
- `src/Core/Foundations/Presentation/Errors/presentation-error.ts` — Target: RETAIN + implement as DU type
- `src/Core/Foundations/Presentation/Errors/presentation-error.types.ts` — Target: NEW file with 5 variant types
- `src/Core/Foundations/Presentation/Errors/index.ts` — Target: UPDATE barrel
- `src/Core/Foundations/Presentation/Mappers/application-to-presentation-error.mapper.ts` — Target: RETAIN + implement (restructured responsibility per D-14)
- `src/Core/Foundations/Presentation/Mappers/application-to-presentation-result.mapper.ts` — Target: RETAIN + implement (with try/catch safety per D-15)
- `src/Core/Foundations/Presentation/Mappers/index.ts` — Target: UPDATE barrel
- `src/Core/Foundations/Presentation/Results/presentation-result.ts` — Target: RETAIN + implement as DU type
- `src/Core/Foundations/Presentation/Results/index.ts` — Target: UPDATE barrel

### Files to DELETE
- `src/Core/Foundations/Presentation/Errors/presentation-error.contract.ts` — DELETE
- `src/Core/Foundations/Presentation/Errors/presentation-error.validator.ts` — DELETE
- `src/Core/Foundations/Presentation/Errors/presentation-error.type-guard.ts` — DELETE
- `src/Core/Foundations/Presentation/Errors/Specific/` (entire directory tree) — DELETE
- `src/Core/Foundations/Presentation/Results/presentation-result.contract.ts` — DELETE
- `src/Core/Foundations/Presentation/Results/presentation-result.validator.ts` — DELETE
- `src/Core/Foundations/Presentation/Results/presentation-result.type-guard.ts` — DELETE
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ok()/err() functions** (`Base/Abstracts/result-base.ts`) — Pattern reference for standalone factory functions (D-09)
- **ApplicationError class hierarchy** (`Application/Errors/application-error.ts` + `Specific/`) — Input to error mapper; subclass detection via `instanceof` (D-11)
- **Domain→App mapper** (`Application/Mappers/domain-to-application-error.mapper.ts`) — Reference for mapper pattern
- **CorrelationId branded type + factory** (`Kernel/Primitives/Types/correlation-id.type.ts`) — Used in mapper params for generating operationId
- **ErrorCode branded type** (`Kernel/Primitives/Types/error-code.type.ts`) — Reference for errorCode format convention

### Established Patterns
- **Standalone factory functions** — ok()/err() in Base layer (D-09 reference)
- **Barrel chain** — Subdirectory index.ts → parent index.ts (Phase 2 D-29..D-31)
- **Duck typing for validation** — Property-based structural checks (Phase 2 D-20)
- **File naming** — `*.contract.ts`, `*.type-guard.ts`, `*.validator.ts`, `*.mapper.ts` conventions
- **Named params for multi-param functions** — Prior phase mappers use params objects

### Integration Points
- `src/Core/Foundations/Application/Results/application-result.ts` — ApplicationResult<T> (input to result mapper)
- `src/Core/Foundations/Application/Errors/application-error.ts` — ApplicationError (input to error mapper)
- `src/Core/Foundations/Application/Errors/Specific/` — Specific ApplicationError subclasses (instanceof detection targets)
- `src/Core/Foundations/Presentation/index.ts` — Top-level barrel (to be created and later linked from Foundations/index.ts)
- `src/Core/Kernel/Primitives/Types/operation-id.type.ts` — OperationId factory for generating operationId in mapper
</code_context>

<deferred>
## Deferred Ideas

- **Full metadata on PresentationResult** (duration, timestamp, retryAfter) — D-07 chose partial v1 with operationId only; revisit in follow-up if client needs richer observability
- **i18n/locale-aware userMessage system** — D-13 chose hybrid auto-generate + override; a proper locale system would be a separate feature
- **Client-side error UI components** (ErrorBoundary, error toasts based on PresentationError._tag) — deferred to module phases
- **Runtime DU validation on client** — D-16 deletes type-guard/validator stubs; add if production data shows malformed DUs reaching client
- **Foundations/index.ts export** — Currently only exports Base; Presentation may be added after Phase 6 is stable
- **NetworkError statusCode/retryAfter** — D-05 chose minimal; add if client needs differentiated network error UI

### Reviewed Todos (not folded)
None — no pending todos matched Phase 6 scope.
</deferred>

---

*Phase: 06-presentation-layer*
*Context gathered: 2026-06-17*
