# Phase 4: Application Layer - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 22 new/modified + 7 to delete
**Analogs found:** 18 / 20 (2 have no close codebase analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `Contracts/application-error.contract.ts` | contract | type-definition | `Domain/Contracts/domain-error.contract.ts` | exact |
| `Contracts/request-context.contract.ts` | contract | type-definition | `Domain/Contracts/domain-error.contract.ts` | role-match |
| `Contracts/command-handler.contract.ts` | contract | type-definition | *(no analog — first CQRS interface)* | — |
| `Contracts/query-handler.contract.ts` | contract | type-definition | *(no analog — first CQRS interface)* | — |
| `Contracts/command-handler-decorator.ts` | contract | decorator | *(no analog — new decorator pattern)* | — |
| `Contracts/query-handler-decorator.ts` | contract | decorator | *(no analog — new decorator pattern)* | — |
| `Contracts/index.ts` | barrel | no-flow | `Domain/Contracts/index.ts` | exact |
| `Errors/application-error.ts` | error-class | no-flow | `Domain/Errors/domain-error.ts` | exact |
| `Errors/application-error.validator.ts` | validator | request-response | `Domain/Errors/domain-error.validator.ts` | exact |
| `Errors/application-error.type-guard.ts` | type-guard | no-flow | `Domain/Errors/domain-error.type-guard.ts` | exact |
| `Errors/index.ts` | barrel | no-flow | `Domain/Errors/index.ts` | exact |
| `Errors/Specific/use-case-execution.error.ts` | error-class | no-flow | `Domain/Errors/Specific/user-not-found.error.ts` | exact |
| `Errors/Specific/authorization.error.ts` | error-class | no-flow | `Domain/Errors/Specific/user-not-found.error.ts` | exact |
| `Errors/Specific/command-validation.error.ts` | error-class | no-flow | `Domain/Errors/Specific/user-not-found.error.ts` | exact |
| `Errors/Specific/index.ts` | barrel | no-flow | `Domain/Errors/Specific/index.ts` | exact |
| `Results/application-result.ts` | type-alias | no-flow | `Domain/Results/domain-result.ts` | exact |
| `Results/index.ts` | barrel | no-flow | `Domain/Results/index.ts` | exact |
| `Mappers/domain-to-application-error.mapper.ts` | mapper | transform | `Base/Factories/*.factory.ts` | partial-match |
| `Mappers/index.ts` | barrel | no-flow | `Domain/Results/index.ts` | role-match |
| `Application/index.ts` | barrel | no-flow | `Domain/index.ts` | exact |

### Files to DELETE

| File | Reason |
|------|--------|
| `Results/application-result.contract.ts` | D-12: pure type alias needs no contract |
| `Results/application-result.validator.ts` | D-12: type alias needs no validator |
| `Results/application-result.type-guard.ts` | D-12: type alias needs no type guard |
| `Errors/Specific/AuthorizationErrors/` | D-27: flat file org, no subdirs |
| `Errors/Specific/ComplaintErrors/` | D-27: flat file org, no subdirs |
| `Errors/Specific/AuthenticationErrors/` | D-27: flat file org, no subdirs |
| `Errors/Specific/UserErrors/` | D-27: flat file org, no subdirs |

---

## Pattern Assignments

### `Contracts/application-error.contract.ts` (contract, type-definition)

**Analog:** `src/Core/Foundations/Domain/Contracts/domain-error.contract.ts`

**File path:** `src/Core/Foundations/Domain/Contracts/domain-error.contract.ts` (lines 1-6)

**Imports pattern:**
```typescript
import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
```

**Core contract pattern** (lines 3-6):
```typescript
export interface DomainErrorContract extends ErrorBase {
  readonly businessRule: string;
  readonly aggregateId: string;
}
```

**Application adaptation:** Contract must add `operationName`, `correlationId`, `userId` fields as follows:
```typescript
import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export interface ApplicationErrorContract extends ErrorBase {
  readonly operationName: string;
  readonly correlationId: CorrelationId;
  readonly userId?: string;
}
```

---

### `Contracts/request-context.contract.ts` (contract, type-definition)

**Analog:** `src/Core/Foundations/Domain/Contracts/domain-error.contract.ts` (contract interface pattern)

**Adaptation:** Minimal interface with `correlationId` and optional `userId`. This is a new concept — no exact analog. Pattern follows the same contract interface structure.

```typescript
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export interface RequestContext {
  readonly correlationId: CorrelationId;
  readonly userId?: string;
}
```

---

### `Contracts/command-handler.contract.ts` (contract, type-definition)

**No direct analog in codebase** — first CQRS handler interface. Pattern follows generic TypeScript interface conventions.

```typescript
import type { ApplicationResult } from "../Results/application-result";
import type { RequestContext } from "./request-context.contract";

export interface ICommandHandler<TCommand, TResult> {
  execute(
    command: TCommand,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
```

---

### `Contracts/query-handler.contract.ts` (contract, type-definition)

**No direct analog in codebase** — first CQRS handler interface. Same pattern as command handler.

```typescript
import type { ApplicationResult } from "../Results/application-result";
import type { RequestContext } from "./request-context.contract";

export interface IQueryHandler<TQuery, TResult> {
  execute(
    query: TQuery,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
```

---

### `Contracts/command-handler-decorator.ts` (contract, decorator)

**No direct analog in codebase** — new decorator pattern. Pattern: abstract class implementing handler interface, accepting inner handler via constructor injection.

```typescript
import type { ICommandHandler } from "./command-handler.contract";
import type { RequestContext } from "./request-context.contract";
import type { ApplicationResult } from "../Results/application-result";

export abstract class CommandHandlerDecorator<TCommand, TResult>
  implements ICommandHandler<TCommand, TResult>
{
  constructor(
    protected readonly innerHandler: ICommandHandler<TCommand, TResult>,
  ) {}

  abstract execute(
    command: TCommand,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
```

---

### `Contracts/query-handler-decorator.ts` (contract, decorator)

Same pattern as `CommandHandlerDecorator` but implements `IQueryHandler`.

```typescript
import type { IQueryHandler } from "./query-handler.contract";
import type { RequestContext } from "./request-context.contract";
import type { ApplicationResult } from "../Results/application-result";

export abstract class QueryHandlerDecorator<TQuery, TResult>
  implements IQueryHandler<TQuery, TResult>
{
  constructor(
    protected readonly innerHandler: IQueryHandler<TQuery, TResult>,
  ) {}

  abstract execute(
    query: TQuery,
    ctx: RequestContext,
  ): Promise<ApplicationResult<TResult>>;
}
```

---

### `Contracts/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/Contracts/index.ts`

**File path:** `src/Core/Foundations/Domain/Contracts/index.ts` (line 1)

```typescript
export type { DomainErrorContract } from "./domain-error.contract";
```

**Application adaptation:**
```typescript
export type { ApplicationErrorContract } from "./application-error.contract";
export type { RequestContext } from "./request-context.contract";
export type { ICommandHandler } from "./command-handler.contract";
export type { IQueryHandler } from "./query-handler.contract";
export { CommandHandlerDecorator } from "./command-handler-decorator";
export { QueryHandlerDecorator } from "./query-handler-decorator";
```

---

### `Errors/application-error.ts` (error-class, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/domain-error.ts`

**File path:** `src/Core/Foundations/Domain/Errors/domain-error.ts` (lines 1-15)

**Imports pattern:**
```typescript
import { ErrorBase } from "@/Core/Foundations/Base/Abstracts/error-base";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { DomainErrorContract } from "../Contracts/domain-error.contract";
```

**Core class pattern** (lines 5-14):
```typescript
export class DomainError extends ErrorBase implements DomainErrorContract {
  constructor(
    override readonly code: string,
    override readonly message: string,
    readonly businessRule: string,
    readonly aggregateId: string,
    cause?: DomainErrorContract,
  ) {
    super(LayerType.DOMAIN, code, message, cause);
  }
}
```

**Application adaptation** (D-01 through D-09):
- Named params object constructor (D-02) instead of positional
- `operationName`, `correlationId`, `userId` added (D-03, D-04, D-05)
- No `retryable` field — uses inherited `isRecoverable()` method (D-06)
- `cause` typed as `ErrorBase` (D-07)
- `layer` hardcoded to `LayerType.APPLICATION` via `super()` (D-08)

```typescript
import { ErrorBase } from "@/Core/Foundations/Base/Abstracts/error-base";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { ErrorBase as ErrorBaseContract } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import type { ApplicationErrorContract } from "../Contracts/application-error.contract";

export class ApplicationError extends ErrorBase implements ApplicationErrorContract {
  readonly operationName: string;
  readonly correlationId: CorrelationId;
  readonly userId?: string;

  constructor(params: {
    code: string;
    message: string;
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    cause?: ErrorBaseContract;
  }) {
    super(LayerType.APPLICATION, params.code, params.message, params.cause);
    this.operationName = params.operationName;
    this.correlationId = params.correlationId;
    this.userId = params.userId;
  }
}
```

---

### `Errors/application-error.validator.ts` (validator, request-response)

**Analog:** `src/Core/Foundations/Domain/Errors/domain-error.validator.ts`

**File path:** `src/Core/Foundations/Domain/Errors/domain-error.validator.ts` (lines 1-38)

**Imports pattern:**
```typescript
import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import type { DomainErrorContract } from "../Contracts/domain-error.contract";
```

**Core validation pattern** (lines 6-33):
```typescript
export class DomainErrorValidator
  implements ErrorValidator<DomainErrorContract>
{
  validate(error: DomainErrorContract): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (error.layer !== LayerType.DOMAIN) {
      errors.push("layer must be DOMAIN");
    }

    if (
      typeof error.businessRule !== "string" ||
      error.businessRule.length === 0
    ) {
      errors.push("businessRule must be a non-empty string");
    }

    if (typeof error.aggregateId !== "string") {
      errors.push("aggregateId must be a string");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: DomainErrorContract): boolean {
    return this.validate(error).isValid;
  }
}
```

**Application adaptation:**
- Check `error.layer !== LayerType.APPLICATION` instead of `DOMAIN`
- Validate `operationName` (non-empty string)
- Validate `correlationId` (string, non-empty using `isCorrelationId`)
- Validate `userId` (optional, type check if present)
- Inherited fields (code, message, timestamp) already validated by base validator

```typescript
import type { ErrorValidator } from "@/Core/Kernel/Contracts/Validators/error-validator.contract";
import type { ValidationResult } from "@/Core/Kernel/Contracts/Validators/layer-validator.contract";
import { LayerType } from "@/Core/Kernel/Primitives/Enums/layer-type.enum";
import { isCorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
import type { ApplicationErrorContract } from "../Contracts/application-error.contract";

export class ApplicationErrorValidator
  implements ErrorValidator<ApplicationErrorContract>
{
  validate(error: ApplicationErrorContract): ValidationResult {
    const errors: string[] = [];

    if (error === null || error === undefined) {
      errors.push("error is null or undefined");
      return { isValid: false, errors };
    }

    if (error.layer !== LayerType.APPLICATION) {
      errors.push("layer must be APPLICATION");
    }

    if (typeof error.operationName !== "string" || error.operationName.length === 0) {
      errors.push("operationName must be a non-empty string");
    }

    if (!isCorrelationId(error.correlationId)) {
      errors.push("correlationId must be a non-empty string");
    }

    if (error.userId !== undefined && typeof error.userId !== "string") {
      errors.push("userId must be a string when provided");
    }

    return { isValid: errors.length === 0, errors };
  }

  satisfiesContract(error: ApplicationErrorContract): boolean {
    return this.validate(error).isValid;
  }
}
```

---

### `Errors/application-error.type-guard.ts` (type-guard, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/domain-error.type-guard.ts`

**File path:** `src/Core/Foundations/Domain/Errors/domain-error.type-guard.ts` (lines 1-23)

**Imports pattern:**
```typescript
import type { DomainError } from "./domain-error";
```

**Core duck-typing pattern** (lines 3-23):
```typescript
export function isDomainError(value: unknown): value is DomainError {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.businessRule !== "string") {
    return false;
  }

  if (typeof obj.aggregateId !== "string") {
    return false;
  }

  return true;
}
```

**Application adaptation:**
- Check `operationName` (string)
- Check `correlationId` (string, non-empty)
- Check `layer` === "application"
- Duck-type rather than `instanceof`

```typescript
import type { ApplicationError } from "./application-error";

export function isApplicationError(value: unknown): value is ApplicationError {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.operationName !== "string") {
    return false;
  }

  if (typeof obj.correlationId !== "string" || (obj.correlationId as string).length === 0) {
    return false;
  }

  if (obj.layer !== "application") {
    return false;
  }

  return true;
}
```

---

### `Errors/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/index.ts`

**File path:** `src/Core/Foundations/Domain/Errors/index.ts` (lines 1-4)

```typescript
export { DomainError } from "./domain-error";
export { isDomainError } from "./domain-error.type-guard";
export { DomainErrorValidator } from "./domain-error.validator";
export * from "./Specific";
```

**Application adaptation:**
```typescript
export { ApplicationError } from "./application-error";
export { isApplicationError } from "./application-error.type-guard";
export { ApplicationErrorValidator } from "./application-error.validator";
export * from "./Specific";
```

---

### `Errors/Specific/use-case-execution.error.ts` (error-class, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts`

**File path:** `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts` (lines 1-12)

```typescript
import { DomainError } from "../domain-error";

export class UserNotFoundError extends DomainError {
  constructor(
    message: string,
    businessRule: string,
    aggregateId: string,
    cause?: DomainError,
  ) {
    super("USER_NOT_FOUND", message, businessRule, aggregateId, cause);
  }
}
```

**Application adaptation:** Named params constructor (matching ApplicationError pattern). `UseCaseExecutionError` wraps a generic `cause: ErrorBase`.

```typescript
import { ApplicationError } from "../application-error";
import type { ErrorBase } from "@/Core/Kernel/Contracts/Base/error-base.contract";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export class UseCaseExecutionError extends ApplicationError {
  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    cause: ErrorBase;
  }) {
    super({
      code: "USE_CASE_EXECUTION_ERROR",
      message: `Use case '${params.operationName}' execution failed`,
      operationName: params.operationName,
      correlationId: params.correlationId,
      userId: params.userId,
      cause: params.cause,
    });
  }
}
```

---

### `Errors/Specific/authorization.error.ts` (error-class, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts`

**Application adaptation:** Adds `reason` (or `requiredPermission`) context field.

```typescript
import { ApplicationError } from "../application-error";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export class AuthorizationFailedError extends ApplicationError {
  readonly reason: string;

  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    reason: string;
    cause?: ApplicationError;
  }) {
    super({
      code: "AUTHORIZATION_FAILED",
      message: `Authorization failed: ${params.reason}`,
      operationName: params.operationName,
      correlationId: params.correlationId,
      userId: params.userId,
      cause: params.cause,
    });
    this.reason = params.reason;
  }

  override isRecoverable(): boolean {
    return false;
  }
}
```

---

### `Errors/Specific/command-validation.error.ts` (error-class, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts`

**Application adaptation:** Adds `fieldErrors: Record<string, string[]>` field.

```typescript
import { ApplicationError } from "../application-error";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export class CommandValidationError extends ApplicationError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
    fieldErrors: Record<string, string[]>;
    cause?: ApplicationError;
  }) {
    const fieldCount = Object.keys(params.fieldErrors).length;
    super({
      code: "COMMAND_VALIDATION_ERROR",
      message: `Command validation failed with ${fieldCount} field error(s)`,
      operationName: params.operationName,
      correlationId: params.correlationId,
      userId: params.userId,
      cause: params.cause,
    });
    this.fieldErrors = params.fieldErrors;
  }

  override isRecoverable(): boolean {
    return false;
  }
}
```

---

### `Errors/Specific/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/Errors/Specific/index.ts`

**File path:** `src/Core/Foundations/Domain/Errors/Specific/index.ts` (lines 1-3)

```typescript
export { ComplaintAlreadyExistsError } from "./complaint-already-exists.error";
export { ComplaintNotFoundError } from "./complaint-not-found.error";
export { UserNotFoundError } from "./user-not-found.error";
```

**Application adaptation:**
```typescript
export { UseCaseExecutionError } from "./use-case-execution.error";
export { AuthorizationFailedError } from "./authorization.error";
export { CommandValidationError } from "./command-validation.error";
```

---

### `Results/application-result.ts` (type-alias, no-flow)

**Analog:** `src/Core/Foundations/Domain/Results/domain-result.ts`

**File path:** `src/Core/Foundations/Domain/Results/domain-result.ts` (lines 1-4)

```typescript
import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import { DomainError } from "../Errors/domain-error";

export type DomainResult<T> = ResultBase<T, DomainError>;
```

**Application adaptation:**
```typescript
import type { ResultBase } from "@/Core/Foundations/Base/Abstracts/result-base";
import { ApplicationError } from "../Errors/application-error";

export type ApplicationResult<T> = ResultBase<T, ApplicationError>;
```

---

### `Results/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/Results/index.ts`

**File path:** `src/Core/Foundations/Domain/Results/index.ts` (line 1)

```typescript
export type { DomainResult } from "./domain-result";
```

**Application adaptation:**
```typescript
export type { ApplicationResult } from "./application-result";
```

---

### `Mappers/domain-to-application-error.mapper.ts` (mapper, transform)

**No exact analog in Domain** (Domain has no mapper files). Pattern follows the existing factory function convention from `Base/Factories/`.

**Analog (partial):** `src/Core/Foundations/Base/Factories/correlation-id-safe.factory.ts` — standalone export function pattern.

```typescript
import { DomainError } from "../../Domain/Errors/domain-error";
import { ApplicationError } from "../Errors/application-error";
import type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";

export function mapDomainToAppError(
  domainError: DomainError,
  params: {
    operationName: string;
    correlationId: CorrelationId;
    userId?: string;
  },
): ApplicationError {
  return new ApplicationError({
    code: domainError.code,
    message: domainError.message,
    operationName: params.operationName,
    correlationId: params.correlationId,
    userId: params.userId,
    cause: domainError,
  });
}
```

---

### `Mappers/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/Results/index.ts` (barrel pattern)

```typescript
export { mapDomainToAppError } from "./domain-to-application-error.mapper";
```

---

### `Application/index.ts` (barrel, no-flow)

**Analog:** `src/Core/Foundations/Domain/index.ts`

**File path:** `src/Core/Foundations/Domain/index.ts` (lines 1-3)

```typescript
export * from "./Contracts";
export * from "./Errors";
export * from "./Results";
```

**Application adaptation:**
```typescript
export * from "./Contracts";
export * from "./Errors";
export * from "./Mappers";
export * from "./Results";
```

---

## Shared Patterns

### Barrel Chain Pattern
**Source:** `src/Core/Foundations/Domain/index.ts`, `src/Core/Foundations/Domain/Errors/index.ts`, `src/Core/Foundations/Domain/Results/index.ts`
**Apply to:** All `index.ts` files in Application layer

The chain follows the established pattern:
- Each subdirectory has its own `index.ts` (barrel)
- `Application/index.ts` re-exports `Contracts/`, `Errors/`, `Mappers/`, `Results/`
- `Errors/index.ts` re-exports error class, type guard, validator, and `Specific/` barrel
- `Specific/index.ts` re-exports each concrete error subclass individually

Naming convention:
```
export { Thing } from "./thing";                    // classes
export { isThing } from "./thing.type-guard";       // type guards
export { ThingValidator } from "./thing.validator";  // validators
export type { Thing } from "./thing";               // type-only interfaces/types
```

### ErrorBase Extension Pattern
**Source:** `src/Core/Foundations/Domain/Errors/domain-error.ts`
**Apply to:** `Errors/application-error.ts`

Pattern: `class extends ErrorBase implements XxxContract`
- Call `super(LayerType.XXX, code, message, cause)` in constructor
- Add layer-specific readonly properties
- Override `isRecoverable()` / `getSeverity()` per subclass

### Contract Interface Pattern
**Source:** `src/Core/Foundations/Domain/Contracts/domain-error.contract.ts`
**Apply to:** `Contracts/application-error.contract.ts`

Pattern: `interface XxxContract extends ErrorBase { readonly ... }`
- Use `readonly` for all fields
- Extends ErrorBase from Kernel contracts
- Import types from Kernel primitives as needed

### Duck-Typing Type Guard Pattern
**Source:** `src/Core/Foundations/Domain/Errors/domain-error.type-guard.ts`
**Apply to:** `Errors/application-error.type-guard.ts`

Pattern: `function isXxx(value: unknown): value is Xxx { ... }`
- Guard: `null`/`undefined` check → `typeof !== "object"` → `as Record<string, unknown>`
- Check duck-type properties with `typeof` checks
- No `instanceof` — property-based structural check only

### Validator Implements ErrorValidator Pattern
**Source:** `src/Core/Foundations/Domain/Errors/domain-error.validator.ts`
**Apply to:** `Errors/application-error.validator.ts`

Pattern: `class XxxValidator implements ErrorValidator<XxxContract>`
- `validate()` returns `ValidationResult { isValid, errors }`
- `satisfiesContract()` delegates to `validate().isValid`
- Layer check: `error.layer !== LayerType.XXX`
- Null/undefined guard at top

### Concrete Error Subclass Pattern
**Source:** `src/Core/Foundations/Domain/Errors/Specific/user-not-found.error.ts`
**Apply to:** All files in `Errors/Specific/`

Pattern: `class XxxError extends XxxBaseError { constructor(...) { super("CODE", ...) } }`
- Hardcoded error code string
- Add specialized properties as `readonly` fields
- Override `isRecoverable()` and `getSeverity()` as needed

## No Analog Found

Files with no close match in the codebase (planner should use Context.md decisions and Research.md instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `Contracts/command-handler.contract.ts` | contract | type-definition | First CQRS handler interface — no existing analog in codebase |
| `Contracts/query-handler.contract.ts` | contract | type-definition | Same — new CQRS pattern |
| `Contracts/command-handler-decorator.ts` | contract | decorator | New decorator base class pattern — no analog |
| `Contracts/query-handler-decorator.ts` | contract | decorator | Same — new decorator pattern |
| `Contracts/request-context.contract.ts` | contract | type-definition | New RequestContext concept — no analog |

These have no codebase analogs because CQRS interfaces and decorator bases are being introduced for the first time at the Application layer. The planner should use the CONTEXT.md decisions (D-14 through D-22) and RESEARCH.md patterns for guidance.

## Metadata

**Analog search scope:** `src/Core/Foundations/Domain/`, `src/Core/Foundations/Base/`, `src/Core/Kernel/Contracts/`
**Files scanned:** ~30
**Pattern extraction date:** 2026-06-11
