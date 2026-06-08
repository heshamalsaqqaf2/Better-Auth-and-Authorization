# Phase 3: Domain Layer - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 3 delivers:** Business rule errors and results carrying domain semantics — `DomainError` class extending `ErrorBase` with `businessRule` and `aggregateId` context, `DomainResult<T>` type alias constrained to `DomainError`, domain type guards and validators that discriminate domain errors at runtime, and concrete domain error subclasses (`ComplaintNotFoundError`, `ComplaintAlreadyExistsError`, `UserNotFoundError`) that serve as working examples of the extension pattern.

**What Phase 3 does NOT deliver:**
- Application errors/results with observability (metrics, audit) — Phase 4
- Infrastructure errors/results with retry/timeout/circuit-breaker — Phase 5
- Presentation DUs for RSC serialization — Phase 6
- Cross-layer mappers — deferred to later phases
- Tests — deferred (per PROJECT.md)
- Full `ValidationError` class — remains as lightweight interface + factory in `Base/Factories/`

</domain>

<decisions>
## Implementation Decisions

### DomainError Class (`Domain/Errors/domain-error.ts`)
- **D-01:** `businessRule` — readonly string property, required constructor parameter. Represents the business rule that was violated.
- **D-02:** `aggregateId` — readonly string property, required constructor parameter. References the affected domain entity/aggregate.
- **D-03:** `layer` — hardcoded to `LayerType.DOMAIN` in constructor. Not overridable by subclasses.
- **D-04:** `isRecoverable()` / `getSeverity()` — override per subclass (follows Phase 2 pattern: default `false` / `Severity.ERROR`). Not stored as constructor properties.
- **D-05:** `cause` — follows ErrorBase pattern: optional `cause?: ErrorBaseContract`.

### Contract Interface (`Domain/Errors/domain-error.contract.ts`)
- **D-06:** Keep `domain-error.contract.ts` — defines `DomainErrorContract` (or `IDomainError`) interface extending `ErrorBase` contract with `businessRule: string` and `aggregateId: string`. The `DomainError` class implements this interface.
- **D-07:** No `domain-result.contract.ts` — the contract file is skipped. DomainResult is a type alias, not a class.

### DomainResult Shape (`Domain/Results/domain-result.ts`)
- **D-08:** Type alias only: `type DomainResult<T> = ResultBase<T, DomainError>`. Uses `Success`/`Failure` from Base with `ok()`/`err()` constrained to `DomainError`. No new class or subclass.

### Specific Domain Errors (`Domain/Errors/Specific/`)
- **D-09:** Implement all scaffolded concrete errors: `ComplaintNotFoundError`, `ComplaintAlreadyExistsError`, `UserNotFoundError` — each as a `DomainError` subclass.
- **D-10:** Flat file organization in `Specific/` — no subdirectories. Files: `complaint.errors.ts`, `user.errors.ts`. Collapse existing `ComplaintErrors/` and `UserErrors/` subdirectories.
- **D-11:** Single `Specific/index.ts` barrel re-exporting all specific errors.

### ValidationError
- **D-12:** Keep `ValidationError` as lightweight interface + `createValidationError()` factory in `Base/Factories/`. No class upgrade in Phase 3.

### Type Guards (`Domain/Errors/domain-error.type-guard.ts`)
- **D-13:** `isDomainError()` — duck-type check for `businessRule` (string) and `aggregateId` (string) properties on the error object, in addition to ErrorBase structural properties. Follows Phase 2 duck-typing pattern.
- **D-14:** No `isDomainResult()` type guard — not needed since DomainResult is a type alias. Runtime discrimination is done via `isDomainError()` on the error property.

### Validators (`Domain/Errors/domain-error.validator.ts`)
- **D-15:** IMPLEMENT `domain-error.validator.ts` — `DomainErrorValidator` implementing `ErrorValidator<DomainErrorContract>` from Kernel contracts. Validates:
  - `layer === LayerType.DOMAIN`
  - `businessRule` is a non-empty string
- **D-16:** SKIP/DELETE `domain-result.validator.ts` — DomainResult is a type alias, not a class. Result validation is handled by validating the inner DomainError via `DomainErrorValidator`.

### Barrel Structure
- **D-17:** `Domain/index.ts` re-exports exactly three things: `export * from './contracts'`, `export * from './errors'`, `export * from './results'`.
- **D-18:** Domain layer does NOT re-export Base layer components. Consumers import Base and Domain separately (or via `Foundations/index.ts` in future phases).
- **D-19:** File naming: use existing scaffold naming convention (`domain-error.ts`, `domain-error.contract.ts`, `domain-error.validator.ts`, `domain-error.type-guard.ts`, `domain-result.ts`, `domain-result.type-guard.ts`). Specific errors use `*.error.ts` suffix (e.g., `complaint-not-found.error.ts`).

### Architecture Constraints (carried from prior phases)
- Zero external dependencies for Domain layer — pure TypeScript only
- Import boundary: Domain imports from Kernel + Base only (no Application, Infrastructure, Presentation)
- Duck typing for validators and type guards (no `instanceof`)
- `businessRule` and `aggregateId` are duck-typed at the property level
- ES2022+ target

### the agent's Discretion
- Exact constructor parameter order for `DomainError` (code, message, businessRule, aggregateId, cause?)
- Whether `DomainErrorContract` interface extends `ErrorBase` or mirrors it structurally
- Exact `ValidationResult` return type for `DomainErrorValidator`
- Internal helper utilities shared between DomainErrorValidator and isDomainError type guard
- Barrel export order within `Specific/index.ts` and `Errors/index.ts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, OOP vs DU decision, import boundaries
- `docs/Base_System.md` §2.2 — DomainError specification (`businessRule`, `aggregateId`, `severity`, `recoverable`); §3.2 — DomainResult specification; §7 — file structure

### Kernel Contracts (contracts DomainError must implement)
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ErrorBase interface (code, message, timestamp, layer, cause, toJSON, isRecoverable, getSeverity)
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts` — ResultBase<T, E> interface (isSuccess, isFailure, data, error, map, flatMap, mapError, match, fold, tap, tapError)
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — ErrorValidator interface (validate, satisfiesContract)

### Base Layer (classes DomainError extends / DomainResult uses)
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — ErrorBase abstract class (isRecoverable default false, getSeverity default ERROR, toJSON with circularity)
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — ResultBase abstract class + Success/Failure + ok/err
- `src/Core/Foundations/Base/Factories/validation-error.ts` — ValidationError interface + createValidationError factory (stays in Base)
- `src/Core/Foundations/Base/Validators/base-error.validator.ts` — BaseErrorValidator (for reference on validator pattern)
- `src/Core/Foundations/Base/TypeGuards/base-error.type-guard.ts` — BaseError type guard (for reference on duck-typing pattern)

### Kernel Primitives
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType enum (LayerType.DOMAIN used in DomainError)

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria, requirements (DOMN-01, DOMN-02, DOMN-03)
- `.planning/REQUIREMENTS.md` — Requirement IDs and traceability
- `.planning/STATE.md` — Current position, accumulated decisions
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/phases/02-foundations-base-layer/02-CONTEXT.md` — Phase 2 decisions (D-01..D-31), many carry forward
- `.planning/phases/01-kernel-layer/01-CONTEXT.md` — Phase 1 decisions (branded types, as const enums, contracts)

### Target Scaffold Files (to be implemented/modified)
- `src/Core/Foundations/Domain/index.ts` — Target: barrel re-exporting contracts, errors, results
- `src/Core/Foundations/Domain/Errors/domain-error.ts` — Target: DomainError class
- `src/Core/Foundations/Domain/Errors/domain-error.contract.ts` — Target: DomainErrorContract interface
- `src/Core/Foundations/Domain/Errors/domain-error.validator.ts` — Target: DomainErrorValidator
- `src/Core/Foundations/Domain/Errors/domain-error.type-guard.ts` — Target: isDomainError type guard
- `src/Core/Foundations/Domain/Errors/Specific/complaint-not-found.error.ts` — Target: ComplaintNotFoundError subclass
- `src/Core/Foundations/Domain/Errors/Specific/complaint-already-exists.error.ts` — Target: ComplaintAlreadyExistsError subclass
- `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts` — Target: UserNotFoundError subclass
- `src/Core/Foundations/Domain/Errors/Specific/index.ts` — Target: barrel for specific errors
- `src/Core/Foundations/Domain/Errors/index.ts` — Target: errors barrel
- `src/Core/Foundations/Domain/Results/domain-result.ts` — Target: DomainResult type alias
- `src/Core/Foundations/Domain/Results/index.ts` — Target: results barrel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ErrorBase abstract class** (`Base/Abstracts/error-base.ts`) — DomainError directly extends this; inherits `toJSON()` with circularity tracking, `isRecoverable()` default, `getSeverity()` default
- **Success/Failure + ok/err** (`Base/Abstracts/result-base.ts`) — DomainResult type alias reuses these directly; no new monadic implementations needed
- **BaseErrorValidator** (`Base/Validators/base-error.validator.ts`) — Reference implementation for DomainErrorValidator pattern
- **isBaseError** (`Base/TypeGuards/base-error.type-guard.ts`) — Reference for duck-typing pattern; isDomainError adds businessRule/aggregateId checks
- **ValidationError interface + createValidationError** (`Base/Factories/validation-error.ts`) — Stays in Base; DomainErrorValidator may reference for return types

### Established Patterns
- **Duck typing for validation** — Property-based structural checks, no instanceof (Phase 2 D-20)
- **Barrel chain** — Subdirectory index.ts → parent index.ts (Phase 2 D-29..D-31)
- **As const enums** — LayerType and Severity values from Kernels
- **Unique-symbol branding** — Branded types pattern from Phase 1
- **File naming** — `*.contract.ts`, `.type-guard.ts`, `.validator.ts`, `*.error.ts` conventions

### Integration Points
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — DomainError `extends` this class
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — DomainResult type alias references ResultBase<T, E>
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — DomainErrorContract interface references/follows this
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — DomainErrorValidator implements this
- `src/Core/Foundations/Domain/index.ts` — Will re-export to consumers (App layer in Phase 4)
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType.DOMAIN used in DomainError

</code_context>

<specifics>
## Specific Ideas

- `businessRule` and `aggregateId` are required string constructor params on DomainError — always present
- `layer` is hardcoded to `LayerType.DOMAIN` — subclasses cannot override; ensures traceability to origin layer
- `isRecoverable()` defaults to `false` via ErrorBase; `getSeverity()` defaults to `Severity.ERROR` via ErrorBase
- DomainError constructor passes `layer = LayerType.DOMAIN` to `super()`
- DomainError `extends ErrorBase implements DomainErrorContract`
- `DomainResult<T>` is simply `type DomainResult<T> = ResultBase<T, DomainError>` — no class, no new file for contract
- `isDomainError()` checks: `typeof error.businessRule === 'string' && typeof error.aggregateId === 'string'`
- `DomainErrorValidator` checks: `value.layer === LayerType.DOMAIN && typeof value.businessRule === 'string' && value.businessRule.length > 0`
- Specific errors: `ComplaintNotFoundError`, `ComplaintAlreadyExistsError` extend DomainError with hardcoded codes; `UserNotFoundError` extends DomainError with hardcoded code
- Flat specific errors directory: `Specific/complaint-not-found.error.ts`, `Specific/complaint-already-exists.error.ts`, `Specific/user-not-found.error.ts`, `Specific/index.ts`
- Collapse existing `ComplaintErrors/` and `UserErrors/` subdirectories — files move to flat `Specific/`
- `Domain/index.ts`: `export * from './contracts'`, `export * from './errors'`, `export * from './results'`

</specifics>

<deferred>
## Deferred Ideas

- Full `ValidationError` class — stays in Base/Factories as lightweight interface + factory; revisit in later phase if needed
- DomainResult subclass with domain-specific helpers — type alias sufficient for Phase 3; revisit if richer API needed
- Cross-layer mappers — Phase 4+

### Reviewed Todos (not folded)
None — no pending todos matched Phase 3 scope.

</deferred>

---

*Phase: 03-domain-layer*
*Context gathered: 2026-06-08*
