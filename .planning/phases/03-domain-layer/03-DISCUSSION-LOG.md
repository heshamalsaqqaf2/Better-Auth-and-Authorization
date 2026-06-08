# Phase 3: Domain Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 03-domain-layer
**Areas discussed:** DomainError extra fields, Contract interface, DomainResult shape, Specific errors scope, ValidationError upgrade, Type guard scope, Validator files, Barrel structure

---

## DomainError extra fields

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, as readonly property | Stored as readonly string property on the class, passed via constructor | ✓ |
| Make optional | businessRule should be optional — some domain errors don't map to a single rule | |
| Skip it entirely | Derive from code/pattern instead. Let subclasses decide. | |

| Option | Description | Selected |
|--------|-------------|----------|
| string | Simple string, flexible, works with any entity ID format | ✓ |
| Generic, defaults to string | DomainError<AggId = string> — generic for subclasses | |
| Skip aggregateId entirely | Not all domain errors relate to an aggregate | |

| Option | Description | Selected |
|--------|-------------|----------|
| Override methods per subclass | isRecoverable() and getSeverity() overridden per subclass | ✓ |
| Constructor params with defaults | Optional constructor params defaulting to ERROR and false | |

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode DOMAIN | Constructor always passes LayerType.DOMAIN to base | ✓ |
| Constructor param defaulting to DOMAIN | Optional layer param defaulting to DOMAIN | |

**User's choice:** businessRule (required string), aggregateId (required string), severity/recoverable via method overrides, layer hardcoded to DOMAIN
**Notes:** Follows Phase 2 default patterns (false/ERROR). aggregateId is a simple string, not generic or branded.

---

## Contract interface

| Option | Description | Selected |
|--------|-------------|----------|
| Skip contract interface | Just the class, no interface file needed | |
| Keep contract interface | Match the Kernel/Base pattern — interface + class implements | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep contract | Define DomainResultContract in contract file | |
| Skip contract | Just the DomainResult class directly | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| No — reuse Kernel validators | Kernel already has LayerValidator/ErrorValidator contracts | ✓ |
| Yes — domain-specific validation | Add DomainError-specific validation rules | |

**User's choice:** DomainError gets contract interface (domain-error.contract.ts), DomainResult does NOT get a contract interface, no domain-specific layer validator
**Notes:** Consistent with Base/Foundations pattern for error, but DomainResult is type alias so contract isn't needed.

---

## DomainResult shape

| Option | Description | Selected |
|--------|-------------|----------|
| Type alias only | DomainResult<T> = ResultBase<T, DomainError> — zero new code | ✓ |
| New subclass with domain helpers | New class extending ResultBase with domain-specific methods | |

**User's choice:** Type alias only
**Notes:** Simple, consistent with existing monadic pattern in Base. TypeScript narrowing on DomainError covers all needs.

---

## Specific errors scope

| Option | Description | Selected |
|--------|-------------|----------|
| Implement all scaffolded errors | ComplaintNotFoundError, ComplaintAlreadyExistsError, UserNotFoundError | ✓ |
| Class infrastructure only | Build DomainError class, leave Specific/ stubs as-is | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep per-use-case subdirectories | ComplaintErrors/, UserErrors/ with sub-indexes | |
| Flat in Specific/ directory | All specific errors as individual files, one barrel | ✓ |

**User's choice:** Implement all scaffolded concrete errors. Flat organization (no subdirectories).
**Notes:** Concrete errors serve as working examples of the extension pattern for developers.

---

## ValidationError upgrade

| Option | Description | Selected |
|--------|-------------|----------|
| Upgrade to DomainError subclass | Full class in Domain layer with cause chain, toJSON | |
| Keep as interface in Base | Stays as lightweight interface + factory in Base/Factories | ✓ |
| Move to Specific/ as concrete error | ValidationError as DomainError subclass in Specific/ | |

**User's choice:** Keep as interface in Base/Factories — no upgrade in Phase 3
**Notes:** ValidationError interface serves its purpose for Base factory returns. Class upgrade deferred.

---

## Type guard scope

| Option | Description | Selected |
|--------|-------------|----------|
| Property duck-type check | Check for businessRule + aggregateId string properties | ✓ |
| Layer check only | Just check layer === LayerType.DOMAIN | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — check isSuccess/isFailure + error is DomainError | isDomainResult narrows ResultBase | |
| No — not needed | TypeScript narrowing on DomainResult is sufficient | ✓ |

**User's choice:** isDomainError duck-types businessRule + aggregateId. No isDomainResult guard needed.
**Notes:** Duck-typing follows Phase 2 pattern consistently.

---

## Validator files

| Option | Description | Selected |
|--------|-------------|----------|
| Implement both | Both domain-error.validator.ts and domain-result.validator.ts | |
| Implement domain-error only | DomainErrorValidator checks layer === DOMAIN + businessRule non-empty | ✓ |
| Skip both | No domain-specific validators needed | |

**User's choice:** Implement domain-error.validator.ts only. DomainErrorValidator implementing ErrorValidator<IDomainError>. Checks layer === DOMAIN and businessRule non-empty string. Skip domain-result.validator.ts — DomainResult validated by validating inner DomainError.

---

## Barrel structure

| Option | Description | Selected |
|--------|-------------|----------|
| Standard barrel chain | Per Phase 2 pattern | |
| Custom structure | Specific directives provided | ✓ |

**User's choice:** Domain/index.ts re-exports contracts, errors, results. Specific/ flat with barrel. No Base re-exports. Collapse ComplaintErrors/ and UserErrors/ subdirectories.

---

## the agent's Discretion

- Exact constructor parameter order for DomainError
- Whether DomainErrorContract extends ErrorBase or mirrors it structurally
- Exact ValidationResult return type for DomainErrorValidator
- Internal helpers shared between validator and type guard
- Barrel export order within Specific/index.ts and Errors/index.ts

## Deferred Ideas

- Full ValidationError class — stays in Base/Factories as lightweight interface + factory
- DomainResult subclass with domain helpers — type alias sufficient for now
