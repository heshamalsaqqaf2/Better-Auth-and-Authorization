---
phase: 04-application-layer
plan: 03
type: execute
wave: 3
subsystem: "Core/Foundations/Application"
tags:
  - "specific-errors"
  - "mapper"
  - "domain-to-app"
  - "UseCaseExecutionError"
  - "AuthorizationFailedError"
  - "CommandValidationError"
depends_on:
  - 04-02
provides:
  - "mapDomainToAppError generic mapper"
  - "UseCaseExecutionError, AuthorizationFailedError, CommandValidationError"
  - "Mappers/index.ts, Results/index.ts, Specific/index.ts barrels"
affects:
  - "src/Core/Foundations/Application/Errors/Specific/*"
  - "src/Core/Foundations/Application/Mappers/*"
  - "src/Core/Foundations/Application/Results/index.ts"
tech-stack:
  added: []
  patterns:
    - "Named params constructor matching ApplicationError pattern"
    - "Conditional assignment for optional fields (exactOptionalPropertyTypes)"
    - "Generic single mapper per D-25"
key-files:
  created:
    - "src/Core/Foundations/Application/Errors/Specific/use-case-execution.error.ts"
    - "src/Core/Foundations/Application/Errors/Specific/authorization.error.ts"
    - "src/Core/Foundations/Application/Errors/Specific/command-validation.error.ts"
  modified:
    - "src/Core/Foundations/Application/Errors/Specific/index.ts"
    - "src/Core/Foundations/Application/Mappers/domain-to-application-error.mapper.ts"
    - "src/Core/Foundations/Application/Mappers/index.ts"
  deleted: []
decisions:
  - "D-23/D-24/D-25: Generic mapDomainToAppError wraps any DomainError preserving code/message/cause chain"
  - "D-26: Three concrete subclass errors prove extension pattern"
  - "D-27: Flat files in Specific/ — no subdirectories"
  - "exactOptionalPropertyTypes: Conditional assignment for userId and cause in each specific error subclass"
  - "ConstructorParameters<typeof ApplicationError>[0] used to type intermediate params object"
  - "Generic over TC39 ErrorBaseContract type import for cause field across all 3 specific errors"
metrics:
  duration: "~6 min"
  tasks: 2
  files_created: 3
  files_modified: 3
  typecheck: pass
  date_completed: "2026-06-11"
---

# Phase 4 Plan 3: Specific Errors, Domain→App Mapper & Barrels

## One-Liner

Implement three concrete `ApplicationError` subclasses (`UseCaseExecutionError`, `AuthorizationFailedError`, `CommandValidationError`), generic `mapDomainToAppError()` mapper, and complete barrel chain for Mappers/ and Results/.

## Deviations from Plan

**exactOptionalPropertyTypes workaround.** The plan specified passing `userId: params.userId` and `cause: params.cause` directly to `super()`. The tsconfig's `exactOptionalPropertyTypes: true` rejects `string | undefined` arguments for optional properties (`userId?: string`). Fixed by building params object without optional fields, then conditionally assigning `userId` and `cause` only when defined — matching the same pattern used in `ApplicationError`.

## Tasks

| # | Name | Type | Outcome |
|---|------|------|---------|
| 1 | Create three ApplicationError subclasses and Specific/index.ts barrel | auto | `use-case-execution.error.ts`, `authorization.error.ts`, `command-validation.error.ts` created; Specific/index.ts updated with all 3 exports |
| 2 | Create Domain→Application mapper and barrel files for Mappers/ and Results/ | auto | `domain-to-application-error.mapper.ts` implements generic `mapDomainToAppError`; Mappers/index.ts exports mapper; Results/index.ts already correct |

## Verification Summary

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass (zero errors) |
| `UseCaseExecutionError extends ApplicationError` with `cause: ErrorBaseContract` (mandatory) | ✅ code: "USE_CASE_EXECUTION_ERROR" |
| `AuthorizationFailedError extends ApplicationError` with `reason: string` | ✅ code: "AUTHORIZATION_FAILED", isRecoverable() => false |
| `CommandValidationError extends ApplicationError` with `fieldErrors: Record<string, string[]>` | ✅ code: "COMMAND_VALIDATION_ERROR", isRecoverable() => false |
| `Specific/index.ts` re-exports all 3 classes | ✅ All three present |
| `mapDomainToAppError(domainError, params)` creates ApplicationError with domainError as cause | ✅ D-23/D-24/D-25 satisfied |
| `Mappers/index.ts` exports `mapDomainToAppError` | ✅ |
| `Results/index.ts` exports `ApplicationResult` | ✅ Pre-existing, unchanged |

## Acceptance Criteria

1. ✅ `UseCaseExecutionError` — mandatory `cause: ErrorBaseContract`, hardcoded `USE_CASE_EXECUTION_ERROR` code, message includes operationName
2. ✅ `AuthorizationFailedError` — `readonly reason: string`, hardcoded `AUTHORIZATION_FAILED` code, `isRecoverable() => false`
3. ✅ `CommandValidationError` — `readonly fieldErrors: Record<string, string[]>`, hardcoded `COMMAND_VALIDATION_ERROR`, `isRecoverable() => false`
4. ✅ All specific errors use named params constructor matching ApplicationError pattern
5. ✅ `mapDomainToAppError` passes `domainError.code` and `domainError.message` through as-is (D-24), sets `cause: domainError` (D-23)
6. ✅ Single generic mapper — no per-use-case variants (D-25)
7. ✅ All barrels export correctly
8. ✅ TypeScript compilation passes with zero errors

## Known Stubs

None — all created files are complete implementations.

## Threat Flags

None — error construction and mappers are pure transformations with no network endpoints, auth paths, or schema changes. Threat model T-04-06 (information disclosure via mapper), T-04-07 (error code disclosure), T-04-08 (authorization reason exposure), and T-04-09 (fieldErrors tampering) adequately addressed.

## Self-Check: PASSED

All created/modified files verified; tsc --noEmit passes with zero errors; all acceptance criteria met; all must_haves truths satisfied.
