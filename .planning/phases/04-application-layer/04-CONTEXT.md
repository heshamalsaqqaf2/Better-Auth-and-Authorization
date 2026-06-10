# Phase 4: Application Layer - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 4 delivers:** Use case orchestration — `ApplicationError` class extending `ErrorBase` with operation context (operationName, correlationId, userId), `ApplicationResult<T>` type alias constrained to `ApplicationError`, Domain-to-Application error mapper preserving cause chains, CQRS handler interfaces (`ICommandHandler`/`IQueryHandler`) with abstract decorator base classes (`CommandHandlerDecorator`/`QueryHandlerDecorator`), and three concrete application error subclasses proving the extension pattern.

**What Phase 4 does NOT deliver:**
- Infrastructure errors/results with retry/timeout/circuit-breaker — Phase 5
- Presentation DUs for RSC serialization — Phase 6
- Cross-layer mappers beyond Domain→Application — deferred to later phases
- Module-specific UseCase implementations — deferred to module phases (Authentication, Complaints, etc.)
- Tests — deferred (per PROJECT.md)
- Observability infrastructure (loggers, metric emitters) — provided at architectural boundaries by consumers
</domain>

<decisions>
## Implementation Decisions

### ApplicationError Class (`Errors/application-error.ts`)
- **D-01:** `cause` only — wraps DomainError (or InfrastructureError) via inherited `cause: ErrorBase` property from ErrorBase. No separate `wrappedDomainError` property.
- **D-02:** Constructor uses named params object: `constructor(params: { code: string; message: string; operationName: string; correlationId: CorrelationId; userId?: string; cause?: ErrorBase })`.
- **D-03:** `operationName: string` — required, represents the UseCase name.
- **D-04:** `correlationId: CorrelationId` — **required**, MUST be passed explicitly from request context. NOT auto-generated. Enables distributed tracing.
- **D-05:** `userId?: string` — optional, supports background jobs/webhooks/system tasks without user context.
- **D-06:** **OMIT `retryable` field** — no boolean data property. Use inherited `isRecoverable(): boolean` method for retry behavior (OOP principle: behavior via methods).
- **D-07:** `cause` typed as `ErrorBase` (the existing Kernel contract), not restricted to `DomainError` — supports wrapping Infrastructure errors too.
- **D-08:** `layer` — hardcoded to `LayerType.APPLICATION` in constructor (follows Phase 3 D-03 pattern).
- **D-09:** `isRecoverable()` / `getSeverity()` — override per subclass (follows Phase 2 pattern: default `false` / `Severity.ERROR`).

### Application Contract Interface (`Contracts/application-error.contract.ts`)
- **D-10:** Keep `Contracts/application-error.contract.ts` — defines `ApplicationErrorContract` interface extending `ErrorBase` with `operationName: string`, `correlationId: CorrelationId`, `userId?: string`. ApplicationError class implements this interface.

### ApplicationResult Shape (`Results/application-result.ts`)
- **D-11:** Pure type alias only: `type ApplicationResult<T> = ResultBase<T, ApplicationError>`. Uses `Success`/`Failure` from Base with `ok()`/`err()` constrained to `ApplicationError`. No new class or subclass.
- **D-12:** **DELETE** scaffold files: `application-result.contract.ts`, `application-result.validator.ts`, `application-result.type-guard.ts`. A type alias does not need contracts, validators, or type guards.
- **D-13:** No method overrides on `tap()`/`tapError()`. No auto-logging. Observability is handled at architectural boundaries (Server Actions, API controllers) via `.tapError(err => logger.error(err.toJSON()))` or `.match()`.

### CorrelationId Propagation
- **D-14:** **NOT constructor-injected** — UseCases are singletons; injecting request-scoped data causes concurrency bugs.
- **D-15:** Flows via `RequestContext` interface passed as method argument to `UseCase.execute(command, ctx)`.
- **D-16:** `RequestContext` minimal interface: `{ correlationId: CorrelationId; userId?: string }`. Extended by module phases as needed.

### CQRS Handler Interfaces (`Contracts/`)
- **D-17:** `ICommandHandler<TCommand, TResult>` — single `execute(command: TCommand, ctx: RequestContext): Promise<ApplicationResult<TResult>>` method.
- **D-18:** `IQueryHandler<TQuery, TResult>` — single `execute(query: TQuery, ctx: RequestContext): Promise<ApplicationResult<TResult>>` method.
- **D-19:** Separate interfaces maintain CQRS boundary — prevents applying Command decorators (e.g., Transactions) to Queries.

### UseCase Decorator Base Classes (`Contracts/` or shared location)
- **D-20:** `abstract class CommandHandlerDecorator<TCommand, TResult> implements ICommandHandler<TCommand, TResult>` — accepts inner handler via `protected readonly innerHandler: ICommandHandler<TCommand, TResult>` constructor injection; declares abstract `execute()` method.
- **D-21:** `abstract class QueryHandlerDecorator<TQuery, TResult> implements IQueryHandler<TQuery, TResult>` — same pattern for queries.
- **D-22:** Enables targeted cross-cutting: LoggingUseCaseDecorator, TransactionDecorator (Commands), CachingDecorator (Queries).

### Domain → Application Error Mapper (`Mappers/domain-to-application-error.mapper.ts`)
- **D-23:** Generic standalone function: `mapDomainToAppError(domainError: DomainError, params: { operationName: string; correlationId: CorrelationId }): ApplicationError`.
- **D-24:** Passes through unknown DomainError types generically — wraps any DomainError into ApplicationError using the domain error's `code`/`message` as-is, adds operation context, sets domainError as `cause`.
- **D-25:** No per-use-case mapper functions — single generic mapper suffices for the foundation layer.

### Specific Application Errors (`Errors/Specific/`)
- **D-26:** Three concrete ApplicationError subclasses to prove extension pattern:
  - `UseCaseExecutionError` — Generic wrapper taking `cause: ErrorBase`. Wraps Domain or Infrastructure errors.
  - `AuthorizationFailedError` — Adds `requiredPermission?: string` or `reason: string` context.
  - `CommandValidationError` — Adds `fieldErrors: Record<string, string[]>` for input validation failures.
- **D-27:** Flat file organization in `Specific/` — no subdirectories. Files: `use-case-execution.error.ts`, `authorization.error.ts`, `command-validation.error.ts`.
- **D-28:** Single `Specific/index.ts` barrel re-exporting all three.

### Validator & Type Guard
- **D-29:** KEEP `Errors/application-error.validator.ts` — `ApplicationErrorValidator` implementing `ErrorValidator<ApplicationErrorContract>`. Validates `layer === LayerType.APPLICATION`.
- **D-30:** KEEP `Errors/application-error.type-guard.ts` — `isApplicationError()` duck-type check. Follows Phase 2/3 duck-typing pattern.

### Directory Structure
- **D-31:** Top-level subdirectories: `Contracts/`, `Errors/`, `Mappers/`, `Results/`. NOT collapsed — `Contracts/` holds CQRS interfaces which are not error-related.
- **D-32:** `Contracts/` populated with: `application-error.contract.ts`, `request-context.contract.ts` (RequestContext interface), `command-handler.contract.ts` (ICommandHandler), `query-handler.contract.ts` (IQueryHandler), `index.ts` barrel.
- **D-33:** Decorator base classes (D-20, D-21) placed in `Contracts/` alongside handler interfaces.

### Architecture Constraints (carried from prior phases)
- Zero external dependencies for Application layer — pure TypeScript only
- Import boundary: Application imports from Domain + Kernel + Base (no Infrastructure, Presentation)
- Duck typing for validators and type guards (no `instanceof`)
- ES2022+ target
- Barrel chain: each subdirectory `index.ts` → `Application/index.ts`

### the agent's Discretion
- Exact `isRecoverable()` default value per subclass (e.g., `AuthorizationFailedError` returns `false`, `UseCaseExecutionError` may delegate to `cause`)
- Validation error message formatting in `ApplicationErrorValidator`
- Barrel export order within subdirectory `index.ts` files
- Whether decorator base classes go in `Contracts/` or a separate `Decorators/` directory
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & System Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, OOP for Application layer, CQRS pattern, constructor injection rules, data flow, return type conformance
- `docs/Base_System.md` §2.2 — ApplicationError specification (operationName, correlationId, userId, retryable behavior via isRecoverable); §3.2 — ApplicationResult specification (type alias, boundary-level observability); §4 — Cross-layer transformation strategy; §7 — File structure
- `.planning/codebase/ARCHITECTURE.md` — Existing architecture audit, Application layer responsibilities, import boundaries, Data Flow §5

### Phase 3 — Domain Layer (errors/mappers consume from here)
- `src/Core/Foundations/Domain/Errors/domain-error.ts` — DomainError class (what ApplicationError wraps as cause)
- `src/Core/Foundations/Domain/Errors/domain-error.contract.ts` — DomainErrorContract interface
- `src/Core/Foundations/Domain/Results/domain-result.ts` — DomainResult type alias (input to mapper)

### Kernel Contracts (contracts ApplicationError implements)
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ErrorBase interface (code, message, timestamp, layer, cause, toJSON, isRecoverable, getSeverity)
- `src/Core/Kernel/Contracts/Base/result-base.contract.ts` — ResultBase<T, E> interface
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — ErrorValidator interface

### Base Layer (classes ApplicationError extends / ApplicationResult uses)
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — ErrorBase abstract class (isRecoverable default false, getSeverity default ERROR, toJSON with circularity)
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — ResultBase abstract class + Success/Failure + ok/err
- `src/Core/Foundations/Base/Validators/base-error.validator.ts` — BaseErrorValidator (reference for validator pattern)

### Kernel Primitives
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts` — LayerType enum (LayerType.APPLICATION used in ApplicationError)
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` — CorrelationId branded type + factory

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria, requirements (APP-01, APP-02, APP-03)
- `.planning/REQUIREMENTS.md` — Requirement IDs and traceability
- `.planning/STATE.md` — Current position, accumulated decisions
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/phases/03-domain-layer/03-CONTEXT.md` — Phase 3 decisions (what mapper consumes)
- `.planning/phases/02-foundations-base-layer/02-CONTEXT.md` — Phase 2 decisions (D-01..D-31), many carry forward
- `.planning/phases/01-kernel-layer/01-CONTEXT.md` — Phase 1 decisions

### Target Scaffold Files (to be implemented/modified)
- `src/Core/Foundations/Application/index.ts` — Target: barrel re-exporting contracts, errors, mappers, results
- `src/Core/Foundations/Application/Contracts/application-error.contract.ts` — Target: ApplicationErrorContract interface
- `src/Core/Foundations/Application/Contracts/request-context.contract.ts` — Target: RequestContext interface
- `src/Core/Foundations/Application/Contracts/command-handler.contract.ts` — Target: ICommandHandler interface
- `src/Core/Foundations/Application/Contracts/query-handler.contract.ts` — Target: IQueryHandler interface
- `src/Core/Foundations/Application/Contracts/index.ts` — Target: barrel
- `src/Core/Foundations/Application/Errors/application-error.ts` — Target: ApplicationError class
- `src/Core/Foundations/Application/Errors/application-error.validator.ts` — Target: ApplicationErrorValidator
- `src/Core/Foundations/Application/Errors/application-error.type-guard.ts` — Target: isApplicationError type guard
- `src/Core/Foundations/Application/Errors/index.ts` — Target: errors barrel
- `src/Core/Foundations/Application/Errors/Specific/use-case-execution.error.ts` — Target: UseCaseExecutionError
- `src/Core/Foundations/Application/Errors/Specific/authorization.error.ts` — Target: AuthorizationFailedError
- `src/Core/Foundations/Application/Errors/Specific/command-validation.error.ts` — Target: CommandValidationError
- `src/Core/Foundations/Application/Errors/Specific/index.ts` — Target: specific errors barrel
- `src/Core/Foundations/Application/Results/application-result.ts` — Target: ApplicationResult type alias
- `src/Core/Foundations/Application/Results/index.ts` — Target: results barrel
- `src/Core/Foundations/Application/Mappers/domain-to-application-error.mapper.ts` — Target: generic mapper function
- `src/Core/Foundations/Application/Mappers/index.ts` — Target: mappers barrel

### Files to DELETE (stubs that contradict pure type alias decision)
- `src/Core/Foundations/Application/Results/application-result.contract.ts` — DELETE
- `src/Core/Foundations/Application/Results/application-result.validator.ts` — DELETE
- `src/Core/Foundations/Application/Results/application-result.type-guard.ts` — DELETE
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ErrorBase abstract class** (`Base/Abstracts/error-base.ts`) — ApplicationError directly extends this; inherits `toJSON()` with circularity tracking, `isRecoverable()` default, `getSeverity()` default
- **Success/Failure + ok/err** (`Base/Abstracts/result-base.ts`) — ApplicationResult type alias reuses these directly; no new monadic implementations needed
- **DomainError class** (`Domain/Errors/domain-error.ts`) — What the mapper wraps as cause
- **CorrelationId branded type + factory** (`Kernel/Primitives/Types/correlation-id.type.ts`) — Required in every ApplicationError
- **BaseErrorValidator** (`Base/Validators/base-error.validator.ts`) — Reference for ApplicationErrorValidator pattern
- **isBaseError** (`Base/TypeGuards/base-error.type-guard.ts`) — Reference for duck-typing pattern
- **Domain→App mapper scaffold** (`Application/Mappers/domain-to-application-error.mapper.ts`) — Empty stub ready to implement

### Established Patterns
- **Duck typing for validation** — Property-based structural checks, no instanceof (Phase 2 D-20)
- **Barrel chain** — Subdirectory index.ts → parent index.ts (Phase 2 D-29..D-31)
- **As const enums** — LayerType and Severity values from Kernel
- **Unique-symbol branding** — Branded types pattern from Phase 1
- **File naming** — `*.contract.ts`, `*.type-guard.ts`, `*.validator.ts`, `*.error.ts` conventions
- **ErrorBase `cause` chain** — Set-based circularity tracking via toJSON()

### Integration Points
- `src/Core/Foundations/Base/Abstracts/error-base.ts` — ApplicationError `extends` this class
- `src/Core/Foundations/Base/Abstracts/result-base.ts` — ApplicationResult type alias references ResultBase<T, E>
- `src/Core/Foundations/Domain/Errors/domain-error.ts` — Mapper consumes DomainError instances
- `src/Core/Foundations/Domain/Errors/domain-error.contract.ts` — ApplicationErrorContract extends/parallels this
- `src/Core/Kernel/Contracts/Base/error-base.contract.ts` — ApplicationErrorContract extends this
- `src/Core/Kernel/Contracts/Validators/error-validator.contract.ts` — ApplicationErrorValidator implements this
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts` — CorrelationId used in constructor and RequestContext
- `src/Core/Foundations/Application/index.ts` — Top-level barrel to expose to consumers (Infrastructure in Phase 5, Presentation in Phase 6)
</code_context>

<specifics>
## Specific Ideas

- ApplicationError constructor: `constructor({ code, message, operationName, correlationId, userId, cause })` — named params object
- `layer` hardcoded to `LayerType.APPLICATION` passed to `super()`
- ApplicationError `extends ErrorBase implements ApplicationErrorContract`
- `ApplicationResult<T>` is simply `type ApplicationResult<T> = ResultBase<T, ApplicationError>` — no class, no contract file
- `RequestContext` interface: `{ correlationId: CorrelationId; userId?: string }` — minimal, extendable
- `ICommandHandler.execute(command, ctx)` / `IQueryHandler.execute(query, ctx)` — both return `Promise<ApplicationResult<TResult>>`
- Decorator bases wrap inner handler and delegate `execute()` with pre/post logic
- Generic mapper: `mapDomainToAppError(domainError, { operationName, correlationId })` — creates ApplicationError with domainError as cause
- Specific errors extend ApplicationError with specialized properties
- Flat `Specific/` directory — no subdirectories, consistent with Phase 3 D-10
- `Application/index.ts` barrel re-exports contracts, errors, mappers, results
</specifics>

<deferred>
## Deferred Ideas

- Infrastructure errors/results with retry/timeout/circuit-breaker — Phase 5
- Presentation DUs for RSC serialization — Phase 6
- Application → Infrastructure mapper — Phase 5
- Application → Presentation mapper — Phase 6
- Module-specific UseCase implementations — module phases
- Observability infrastructure (structured logger, metric emitter) — provided at architectural boundaries by consumers
- Full testing — per PROJECT.md

### Reviewed Todos (not folded)
None — no pending todos matched Phase 4 scope.
</deferred>

---

*Phase: 04-application-layer*
*Context gathered: 2026-06-11*
