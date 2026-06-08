# Phase 2: Foundations Base Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 02-foundations-base-layer
**Areas discussed:** ErrorBase abstract class design, Circularity detection in toJSON(), Success/Failure class hierarchy, Result monadic semantics, Validator & type guard strategy, WR-01: Result-wrapped factory functions, Barrel export & file organization

---

## ErrorBase Abstract Class Design

| Option | Description | Selected |
|--------|-------------|----------|
| isRecoverable defaults to false | Provide a default isRecoverable() that returns false; subclasses override when needed | ✓ |
| isRecoverable stays abstract | Every subclass must explicitly declare recoverability | |
| Only toJSON has default impl | Keep isRecoverable() and getSeverity() both abstract | |

**User's choice:** isRecoverable defaults to false
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Default to Severity.ERROR | Provide a default getSeverity() that returns Severity.ERROR | ✓ |
| Abstract — no default | Every subclass declares its own severity | |

**User's choice:** Default to Severity.ERROR
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate timestamp | Constructor sets timestamp = new Date() automatically | ✓ |
| Require timestamp | Subclasses must pass timestamp explicitly | |

**User's choice:** Auto-generate timestamp
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — define ValidationError in Base | Concrete class in Base layer for validators and factory Result-wrapping | |
| No — defer to Domain layer (Phase 3) | Phase 2 validators just return ValidationResult | ✓ |

**User's choice:** No — defer to Domain layer
**Notes:** Later in the discussion, a lightweight ValidationError *interface* (not class) was approved for use with safe factory functions, placed in a new Factories/ directory.

| Option | Description | Selected |
|--------|-------------|----------|
| Require layer in constructor | Subclasses pass layer via super() | ✓ |
| Make layer abstract property | Subclasses declare readonly layer directly | |

**User's choice:** Require layer in constructor
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Implement the interface | Declare abstract class ErrorBase implements KernelErrorBase | ✓ |
| Implicit structural match | Don't declare implements | |

**User's choice:** Implement the interface
**Notes:** Use `import type { ErrorBase as ErrorBaseContract }` for alias.

| Option | Description | Selected |
|--------|-------------|----------|
| Import with alias | import type { ErrorBase as ErrorBaseContract } | ✓ |
| Same name via type-only import | import type { ErrorBase } — erased at runtime | |

**User's choice:** Import with alias
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Optional ErrorBaseContract | cause?: ErrorBaseContract — typed cause chain | ✓ |
| Optional unknown | cause?: unknown — flexible but loses type safety | |
| Optional Error instance | cause?: Error — allows wrapping native JS errors | |

**User's choice:** Optional ErrorBaseContract
**Notes:** None

---

## Circularity Detection in toJSON()

| Option | Description | Selected |
|--------|-------------|----------|
| Set-based with [Circular] marker | Track visited objects, replace with '[Circular]' string | ✓ |
| Set-based with omission | Omit cause field entirely on circular ref | |
| Depth-limit (max 5 levels) | Hard limit on recursion depth | |

**User's choice:** Set-based with [Circular] marker
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Flat with nested cause | { code, message, timestamp, layer, severity, recoverable, cause: { ... } } | ✓ |
| Flat only — no nested cause | Exclude cause from serialization | |

**User's choice:** Flat with nested cause
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Internal Set — callers don't worry | toJSON() creates a fresh Set internally | ✓ |
| Expose as optional Set parameter | Allow external tracking via parameter | |

**User's choice:** Internal Set — callers don't worry
**Notes:** None

---

## Success/Failure Class Hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Extend abstract ResultBase | Success<T> extends ResultBase<T, E> | ✓ |
| Directly implement interface | Each class implements ResultBase interface independently | |

**User's choice:** Extend abstract ResultBase
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| All in result-base.ts | Abstract ResultBase, Success, Failure, and ok()/err() all in one file | ✓ |
| Separate files per class | result-base.ts, success.ts, failure.ts, factories.ts | |

**User's choice:** All in result-base.ts
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone functions | export function ok<T>(data: T): Success<T> | ✓ |
| Static methods | ResultBase.ok(data) and ResultBase.err(error) | |

**User's choice:** Standalone functions
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep error-base.ts / result-base.ts | Matches Base_System.md §7 convention | ✓ |
| Rename to base-error.ts / base-result.ts | Distinguishes from Kernel contract files | |

**User's choice:** Keep error-base.ts / result-base.ts
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal base — only isSuccess/isFailure | Abstract base declares only abstract props; monadic methods in Success/Failure concretely | ✓ |
| Shared defaults in base | Abstract base provides default implementations for monadic methods | |

**User's choice:** Minimal base — only isSuccess/isFailure
**Notes:** None

---

## Result Monadic Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Return self (no-op) | map() on Failure returns this | ✓ |
| Return new Failure of mapped type | Create new Failure<U, E> with same error | |

**User's choice:** Return self (no-op)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Return self (short-circuit) | flatMap() on Failure returns this | ✓ |
| Return new Failure | Create new Failure with same error | |

**User's choice:** Return self (short-circuit)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| No-op (return self) | tap/tapError on wrong variant returns self | ✓ |
| Throw TypeError | Calling tap on Failure throws | |

**User's choice:** No-op (return self)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Return self (no-op) | mapError on Success returns self | ✓ |
| Transform Success to different type | mapError<F> on Success produces ResultBase<T, F> | |

**User's choice:** Return self (no-op)
**Notes:** None

---

## Validator & Type Guard Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Duck typing (structural check) | validate() checks presence of required properties with correct types | ✓ |
| instanceof check | Check if value is instance of ErrorBase abstract class | |

**User's choice:** Duck typing (structural check)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Property-based duck typing | isBaseError checks for code, message, timestamp, layer properties | ✓ |
| instanceof check | isBaseError checks value instanceof ErrorBase | |

**User's choice:** Property-based duck typing
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| satisfiesContract = strict superset of validate | Same checks, boolean return | ✓ |
| satisfiesContract is validate() with ignored errors | Same checks, boolean return, no additional rigor | |

**User's choice:** satisfiesContract = strict superset of validate
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| No — surface-level only | Check top-level object properties only | ✓ |
| Yes — recursive validation | Recursively validate cause chain | |

**User's choice:** No — surface-level only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — base-error.type-guard.ts etc. | Consistent naming across Base layer | ✓ |
| Rename validators too | Different naming to distinguish | |

**User's choice:** Yes — base-error.type-guard.ts etc.
**Notes:** Existing scaffold naming already matches this pattern.

---

## WR-01: Result-Wrapped Factory Functions

| Option | Description | Selected |
|--------|-------------|----------|
| Add safe versions in Base layer | New functions like createCorrelationIdSafe returning Result | ✓ |
| Modify original factories to return Result | Change Phase 1 factories — breaking change | |

**User's choice:** Add safe versions in Base layer
**Notes:** Original throwing factories remain unchanged.

| Option | Description | Selected |
|--------|-------------|----------|
| Use a simple ValidationError interface | Lightweight interface structurally matching ErrorBase | ✓ |
| Keep throwing TypeError | Don't add safe versions in Phase 2 | |
| Use err() with an inline object | Pass object literal that structurally satisfies ErrorBase | |

**User's choice:** Use a simple ValidationError interface
**Notes:** Interface + factory function in new Factories/ directory.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — interface + factory | Define ValidationError interface + createValidationError() factory | ✓ |
| Interface only — inline objects | Just define interface | |
| Make it a simple concrete class | class ValidationError extends ErrorBase — contradicts defer decision | |

**User's choice:** Yes — interface + factory
**Notes:** Factory produces duck-typed objects for err().

| Option | Description | Selected |
|--------|-------------|----------|
| In Base/Abstracts/ alongside error-base.ts | Add validation-error.ts in Abstracts/ | |
| Separate 'Factories' directory in Base | New src/Core/Foundations/Base/Factories/ directory | ✓ |
| In Base/Validators/ | Place near validators | |

**User's choice:** Separate 'Factories' directory in Base
**Notes:** New Factories/ directory for safe branded-type factories + ValidationError.

---

## Barrel Export & File Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Re-export everything from each subdir | Each index.ts re-exports all public symbols | ✓ |
| Selective named exports only | Selectively export specific symbols | |
| No subdir barrels — all through Base/index.ts | Skip subdirectory barrels | |

**User's choice:** Re-export everything from each subdir
**Notes:** Matches Kernel pattern.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Foundations/index.ts | src/Core/Foundations/index.ts re-exports Base (and later all layers) | ✓ |
| No — consumers import Base directly | Import from src/Core/Foundations/Base directly | |

**User's choice:** Yes — Foundations/index.ts
**Notes:** Matches Kernel barrel pattern.

---

## the agent's Discretion

- Exact signatures of `ok()`/`err()` factory functions (return type inference patterns)
- Whether `Success`/`Failure` expose constructors or use `ok()`/`err()` exclusively
- Validation error message formatting in `createValidationError()`
- Internal helper utilities shared between validators and type guards
- Barrel export order within subdirectory `index.ts` files

## Deferred Ideas

- Full `ValidationError` class (with layer, severity, etc.) — Phase 3 (Domain layer)
- Cross-layer mappers — Phase 6
- Tests — per PROJECT.md
