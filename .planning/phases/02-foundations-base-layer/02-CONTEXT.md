# Phase 2: Foundations Base Layer - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 2 delivers:** Reusable abstract base classes that implement Kernel contracts (ErrorBase, ResultBase) with concrete monadic behavior, `toJSON()` serialization with cause-chain circularity detection, runtime type guards, contract-validating validators, and Result-wrapped safe factory functions for branded types.

**What Phase 2 does NOT deliver:**
- Domain-specific errors/results (UserNotFoundError, etc.) — Phase 3
- Application errors/results with observability (metrics, audit) — Phase 4
- Infrastructure errors/results with retry/timeout/circuit-breaker — Phase 5
- Presentation DUs for RSC serialization — Phase 6
- Cross-layer mappers — deferred to later phases
- Tests — deferred (per PROJECT.md)
- Full `ValidationError` class — lightweight interface only; concrete class in Phase 3

</domain>

<decisions>
## Implementation Decisions

### ErrorBase Abstract Class (`Abstracts/error-base.ts`)
- **D-01:** `isRecoverable()` has a default implementation returning `false`. Subclasses override when needed.
- **D-02:** `getSeverity()` has a default implementation returning `Severity.ERROR`. Subclasses override when needed.
- **D-03:** `timestamp` is auto-generated in the constructor (`new Date()`) — not passed as a parameter.
- **D-04:** `layer` is a required constructor parameter — subclasses pass it explicitly.
- **D-05:** The abstract class explicitly `implements ErrorBaseContract` (imported from Kernel as `import type { ErrorBase as ErrorBaseContract }`).
- **D-06:** `cause` is typed as `cause?: ErrorBaseContract` (optional, typed cause chain).

### Circularity Detection in `toJSON()`
- **D-07:** Set-based tracking — a `Set<object>` tracks visited objects during serialization.
- **D-08:** On circular reference: insert the string `"[Circular]"` as the value (not throw, not omit).
- **D-09:** Output shape: nested, flat with recursive cause expansion: `{ code, message, timestamp, layer, severity, recoverable, cause: { ... } }`.
- **D-10:** Circularity tracking Set is managed internally by `toJSON()` — no external parameter.

### ResultBase Abstract Class & Success/Failure Hierarchy (`Abstracts/result-base.ts`)
- **D-11:** Abstract `ResultBase` declares only `isSuccess`, `isFailure`, `data`, `error` as abstract. All monadic methods (`map`, `flatMap`, `match`, `fold`, `tap`, `tapError`, `mapError`) are implemented concretely in `Success<T>` and `Failure<T, E>`.
- **D-12:** `Success<T>` and `Failure<T, E>` extend the abstract `ResultBase` class.
- **D-13:** All three (abstract base, Success, Failure) live in a single file: `Abstracts/result-base.ts`.
- **D-14:** `ok()` and `err()` are standalone exported functions (not static methods).
- **D-15:** Existing file naming kept: `error-base.ts`, `result-base.ts`.

### Result Monadic Operation Semantics
- **D-16:** `map()` on Failure → returns `this` (no-op, fn never called).
- **D-17:** `flatMap()` on Failure → returns `this` (short-circuit).
- **D-18:** `tap()` on Failure → returns `this` without calling fn. `tapError()` on Success → returns `this` without calling fn.
- **D-19:** `mapError()` on Success → returns `this` without calling fn.

### Validator Implementations (Validators/)
- **D-20:** Validators use duck typing (structural checks on properties) — not `instanceof`.
- **D-21:** Type guards also use property-based duck typing, not `instanceof`.
- **D-22:** `satisfiesContract()` performs the same checks as `validate()` but returns `boolean` instead of `ValidationResult`.
- **D-23:** Validation is surface-level only — no recursive `cause` chain validation.
- **D-24:** Existing file naming kept: `base-error.validator.ts`, `base-result.validator.ts`, `base-error.type-guard.ts`, `base-result.type-guard.ts`.

### WR-01: Result-Wrapped Factory Functions (Factories/)
- **D-25:** New `Factories/` subdirectory under Base holds safe Result-wrapped versions: `createCorrelationIdSafe`, `createErrorCodeSafe`, `createOperationIdSafe`.
- **D-26:** Original Phase 1 throwing factories remain unchanged (backward compatible).
- **D-27:** A lightweight `ValidationError` interface (not a class) is defined, along with a `createValidationError()` factory function producing duck-typed ErrorBase objects.
- **D-28:** Safe factories return `Result<CorrelationId, ValidationError>` etc. via `err(createValidationError(...))`.

### Barrel Export & File Organization
- **D-29:** Each subdirectory (Abstracts/, TypeGuards/, Validators/, Factories/) has its own `index.ts` re-exporting all public symbols.
- **D-30:** `Base/index.ts` re-exports all subdirectories via `export * from './...'`.
- **D-31:** `Foundations/index.ts` (parent-level barrel) re-exports `Base` layer output.

### Architecture Constraints (carried from Phase 1)
- ES2022+ target for `unique symbol`, `Error.cause`, private fields
- Zero external dependencies for Foundation layer — pure TypeScript only
- Import boundary: Base depends on Kernel only (no other layers)
- File naming: `*.ts`, dot-separated role suffixes

### the agent's Discretion
- Exact signatures of `ok()`/`err()` factory functions (return type inference patterns)
- Whether `Success`/`Failure` expose constructors or use `ok()`/`err()` exclusively
- Validation error message formatting in `createValidationError()`
- Internal helper utilities shared between validators and type guards
- Barrel export order within subdirectory `index.ts` files

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, OOP vs DU decision, forbidden/mandatory rules
- `docs/Base_System.md` — Complete spec for 4-layer error/result system, §2.1 ErrorBase contract, §3.1 ResultBase contract, §5.3 Layer Validators, §7 file structure

### Phase 1 — Kernel Layer (contracts to implement)
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ErrorBase interface (code, message, timestamp, layer, cause, toJSON, isRecoverable, getSeverity)
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts` — ResultBase<T, E> interface (isSuccess, isFailure, data, error, map, flatMap, mapError, match, fold, tap, tapError)
- `src/Core/Kernel/Contracts/Validators/layer-validator.contract.ts` — ValidationResult type and LayerValidator interface
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — ErrorValidator interface
- `src/Core/Kernel/Contracts/Validators/result-validator.contract.ts` — ResultValidator interface
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType enum values
- `src/Core/Kernel/Primitives/Enums/severity.enum.ts` — Severity enum values
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` — CorrelationId branded type + throwing factory
- `src/Core/Kernel/Primitives/Types/error-code.type.ts` — ErrorCode branded type + throwing factory
- `src/Core/Kernel/Primitives/Types/operation-id.type.ts` — OperationId branded type + throwing factory
- `src/Core/Kernel/Constants/error-codes.constants.ts` — ErrorCodes constant object (empty — Phase 3 fills)
- `src/Core/Kernel/Constants/layer-names.constants.ts` — LayerNames mapping

### Scaffolded Code (target files for Phase 2)
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — Target: abstract ErrorBase class
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — Target: abstract ResultBase + Success + Failure + ok/err
- `src/Core/Foundations/Base/Abstracts/index.ts` — Target: barrel
- `src/Core/Foundations/Base/TypeGuards/base-error.type-guard.ts` — Target: isBaseError type guard
- `src/Core/Foundations/Base/TypeGuards/base-result.type-guard.ts` — Target: isBaseResult type guard
- `src/Core/Foundations/Base/TypeGuards/index.ts` — Target: barrel
- `src/Core/Foundations/Base/Validators/base-error.validator.ts` — Target: BaseErrorValidator implementation
- `src/Core/Foundations/Base/Validators/base-result.validator.ts` — Target: BaseResultValidator implementation
- `src/Core/Foundations/Base/Validators/index.ts` — Target: barrel
- `src/Core/Foundations/Base/index.ts` — Target: base-layer barrel (re-export all subdirs)
- `src/Core/Foundations/index.ts` — Target: foundations-level barrel (re-export Base)

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria, requirements (BASE-01..BASE-06)
- `.planning/STATE.md` — Current position, decisions, deferred items
- `.planning/PROJECT.md` — Core value, constraints, key decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Kernel contracts** — ErrorBase and ResultBase interfaces from Phase 1 are the contracts Phase 2 implements as abstract classes
- **Branded type factories** — CreateCorrelationId, createErrorCode, createOperationId from Phase 1 (throwing — Phase 2 adds Result-wrapped safe versions)
- **ValidationResult type** — Already defined in `layer-validator.contract.ts`; validators reuse this type
- **Barrel pattern** — Kernel's subdirectory barrel chain (Constants/index.ts → Contracts/index.ts → Primitives/index.ts → Kernel/index.ts) is the pattern to follow for Base

### Established Patterns
- **As const enums** — LayerType and Severity use `as const` objects with values arrays; Phase 2 uses these values in default implementations
- **Unique-symbol branding** — Branded types use `declare const __brand: unique symbol` pattern; safe factories need to preserve brand
- **Duck typing for validation** — Phase 1 validators are interface-only; Phase 2 validators use duck typing consistent with the contract design
- **File naming conventions** — `*.contract.ts`, `*.enum.ts`, `*.type.ts`, `*.constants.ts`, `.type-guard.ts`, `.validator.ts`

### Integration Points
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ErrorBase abstract class `implements` this
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts` — ResultBase abstract class `implements` this
- `src/Core/Kernel/Contracts/Validators/` — Validator implementations conform to these interfaces
- `src/Core/Kernel/Primitives/Types/` — Safe factory functions wrap these branded types
- `src/Core/Foundations/index.ts` — Top-level barrel to export Base layer for downstream layers (Phase 3+)

</code_context>

<specifics>
## Specific Ideas

- `isRecoverable()` default: `return false`
- `getSeverity()` default: `return Severity.ERROR`
- `toJSON()` circularity: `const visited = new Set<object>();` — internal to method, recursive helper parameter
- `toJSON()` on circular cause: set `cause: "[Circular]"` as string value
- `map()` on Failure: `return this` (typed as `ResultBase<U, E>`)
- `tap()` on Failure: `return this` without calling fn
- `mapError()` on Success: `return this` without calling fn
- Validator `satisfiesContract()`: `return this.validate(value).isValid`
- Safe factories pattern: `export function createCorrelationIdSafe(value: string): Result<CorrelationId, ValidationError>`
- `ValidationError` interface + `createValidationError()` factory in `Base/Factories/`
- New directory: `src/Core/Foundations/Base/Factories/`

</specifics>

<deferred>
## Deferred Ideas

- Full `ValidationError` class (with layer, severity, etc.) — Phase 3 (Domain layer)
- Cross-layer mappers — Phase 6
- Tests — per PROJECT.md

### Reviewed Todos (not folded)
None — no pending todos matched Phase 2 scope.

</deferred>

---

*Phase: 02-foundations-base-layer*
*Context gathered: 2026-06-08*
