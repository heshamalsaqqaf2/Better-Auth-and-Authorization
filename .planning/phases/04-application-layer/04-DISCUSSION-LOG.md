# Phase 4: Application Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 4-application-layer
**Areas discussed:** ApplicationError shape, ApplicationResult observability, CorrelationId propagation, Mapper approach, UseCase base pattern, Specific application errors, RequestContext, Naming, ApplicationResult cleanup, File structure

---

## ApplicationError shape

| Option | Description | Selected |
|--------|-------------|----------|
| Use cause only | Consistent with Phase 1-3 pattern. DomainError passed as cause. Simpler API. | ✓ |
| Separate wrappedDomainError | As spec describes. Explicit but duplicates cause chain. | |
| Both, with cause as alias | wrappedDomainError is canonical, toJSON includes as cause. | |

**User's choice:** Use cause only (Recommended)
**Notes:** The user then provided explicit constructor signature: `constructor(params: { code: string, message: string, operationName: string, correlationId: CorrelationId, userId?: string, cause?: ErrorBase })`. No `retryable` field — use inherited `isRecoverable()` method. `cause` typed as `ErrorBase` (not restricted to DomainError).

---

## ApplicationResult observability

| Option | Description | Selected |
|--------|-------------|----------|
| Chainable methods | Separate .log(), .metrics(), .audit(), .trackExecution() methods | |
| Auto-instrumented tap/tapError | tap/tapError automatically log operationName + timing + correlationId | |
| Minimal: just tap/tapError with log | Only inherited monadic methods + logging. Defer metrics/audit/tracking. | ✓ |

**User's choice:** Minimal (just tap/tapError with log) → then corrected with architectural directive
**Notes:** User rejected all three. ApplicationResult is a pure type alias — no method overrides, no auto-logging. Observability at architectural boundaries via `.tapError(err => logger.error(err.toJSON()))` or `.match()`. UseCase Decorator pattern for cross-cutting concerns. ApplicationError itself is the observability payload (via toJSON()).

---

## CorrelationId propagation

| Option | Description | Selected |
|--------|-------------|----------|
| Constructor injection | CorrelationId injected into UseCase constructor | |
| Method argument | Every UseCase.execute() takes correlationId parameter | |
| Boundary-level | Server Action creates ApplicationError with correlationId | |

**User's choice:** Architectural directive — method argument via RequestContext
**Notes:** NO constructor injection (concurrency bugs with singleton UseCases). Group request-scoped variables into `RequestContext`. Final signature: `async execute(command: NameCommand, ctx: RequestContext): Promise<ApplicationResult<NameDTO>>`. Boundary extracts context from HTTP request.

---

## Mapper approach

| Option | Description | Selected |
|--------|-------------|----------|
| Generic function | Single function handles all domain errors generically | ✓ |
| Per-use-case functions | Each UseCase has its own mapper | |
| Mapper class with DI | ApplicationErrorMapper class injected via Composition Root | |

**User's choice:** Generic function (Recommended)
**Notes:** Unknown DomainError types pass through generically — wraps into ApplicationError using domain error's code/message as-is.

---

## UseCase base pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Define IUseCase interface | Generic IUseCase<TCommand, TDTO> with execute(command, ctx) | ✓ |
| Defer to module phases | Phase 4 builds only ApplicationError/ApplicationResult/mapper | |

**User's choice:** Define IUseCase interface (Recommended) → then corrected with CQRS separation
**Notes:** User specified separate `ICommandHandler<TCommand, TResult>` and `IQueryHandler<TQuery, TResult>` interfaces. Two separate decorator base classes: `CommandHandlerDecorator` and `QueryHandlerDecorator`, each accepting inner handler via constructor. Maintains CQRS boundary.

---

## Specific application errors

| Option | Description | Selected |
|--------|-------------|----------|
| Skip specifics | Build only foundational classes. Leave stubs empty. | |
| Fill one example | AuthorizationFailedError as example | |

**User's choice:** Architectural directive — implement three specific errors
**Notes:** Implement `UseCaseExecutionError` (generic wrapper, cause: ErrorBase), `AuthorizationFailedError` (requiredPermission/reason), `CommandValidationError` (fieldErrors). All extend ApplicationError, flat file naming in Specific/.[\n\n---\n\n## RequestContext\n\n| Option | Description | Selected |\n|--------|-------------|----------|\n| Minimal | `{ correlationId: CorrelationId; userId?: string }` | ✓ |\n| Extended | Plus ipAddress, userAgent, timestamp | |\n\n**User's choice:** Minimal (Recommended)\n\n---\n\n## Naming\n\n| Option | Description | Selected |\n|--------|-------------|----------|\n| Use ErrorBase | Consistent with existing Kernel contract | ✓ |\n| Rename to IErrorBase | More conventional I-prefix, breaks existing code | |\n\n**User's choice:** Use ErrorBase (Recommended)\n\n---\n\n## File structure\n\n| Option | Description | Selected |\n|--------|-------------|----------|\n| Keep existing structure | Contracts/, Errors/, Mappers/, Results/ | ✓ |\n| Collapse Contracts into Errors | Move contract into Errors/ like Phase 3 | |\n\n**User's choice:** Architectural directive — keep top-level directories. CQRS interfaces need Contracts/. Delete application-result.contract.ts, .validator, .type-guard. Flat Specific/.[\n\n---\n\n## ApplicationResult cleanup\n\n| Option | Description | Selected |\n|--------|-------------|----------|\n| Keep both | application-result.ts + application-result.contract.ts | |\n| Keep .ts only, delete .contract.ts | Type alias doesn't need separate contract file | ✓ |\n\n**User's choice:** Keep .ts only, delete .contract.ts[/\n\n## the agent's Discretion\n\n- Exact `isRecoverable()` default value per subclass\n- Validation error message formatting in ApplicationErrorValidator\n- Barrel export order within subdirectory `index.ts` files\n- Whether decorator base classes go in `Contracts/` or a separate `Decorators/` directory\n\n## Deferred Ideas\n\n- Infrastructure errors/results with retry/timeout/circuit-breaker — Phase 5\n- Presentation DUs for RSC serialization — Phase 6\n- Module-specific UseCase implementations — module phases\n- Observability infrastructure — provided at architectural boundaries by consumers\n- Tests — per PROJECT.md