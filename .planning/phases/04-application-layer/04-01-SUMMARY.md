---
phase: 04-application-layer
plan: 01
type: execute
subsystem: "Core/Foundations/Application"
tags:
  - "contract"
  - "scaffold-cleanup"
  - "application-error"
  - "request-context"
depends_on: []
provides:
  - "ApplicationErrorContract interface"
  - "RequestContext interface"
affects:
  - "src/Core/Foundations/Application/Contracts/*"
tech-stack:
  added: []
  patterns:
    - "Export type for interfaces (consistent with Domain pattern)"
    - "@ alias path convention consistent with codebase"
key-files:
  created:
    - "src/Core/Foundations/Application/Contracts/request-context.contract.ts"
  modified:
    - "src/Core/Foundations/Application/Contracts/application-error.contract.ts"
  deleted:
    - "src/Core/Foundations/Application/Results/application-result.contract.ts"
    - "src/Core/Foundations/Application/Results/application-result.validator.ts"
    - "src/Core/Foundations/Application/Results/application-result.type-guard.ts"
    - "src/Core/Foundations/Application/Errors/Specific/AuthorizationErrors/authorization-failed.error.ts"
    - "src/Core/Foundations/Application/Errors/Specific/ComplaintErrors/create-complaint-failed.error.ts"
    - "src/Core/Foundations/Application/Errors/Specific/AuthorizationErrors/"
    - "src/Core/Foundations/Application/Errors/Specific/ComplaintErrors/"
    - "src/Core/Foundations/Application/Errors/Specific/AuthenticationErrors/"
    - "src/Core/Foundations/Application/Errors/Specific/UserErrors/"
decisions:
  - "D-10: Keep Contracts/application-error.contract.ts — ApplicationErrorContract extends ErrorBase"
  - "D-12: Delete scaffold contract/validator/type-guard files — pure type alias needs none"
  - "D-16: RequestContext minimal interface with correlationId (required) and userId (optional)"
  - "D-27: Flat file organization for Specific errors — no subdirectories"
metrics:
  duration: "~2 min"
  tasks: 2
  files_modified: 2
  files_deleted: 10
  typecheck: pass
  date_completed: "2026-06-11"
---

# Phase 4 Plan 1: Application Layer Contract Interfaces

## One-Liner

Create `ApplicationErrorContract` (extending `ErrorBase` with `operationName`, `correlationId`, `userId`) and `RequestContext` interfaces; remove 3 scaffold stubs from `Results/` and 4 empty subdirectories from `Errors/Specific/` in preparation for the Application Error class (Plan 02).

## Deviations from Plan

**None** — plan executed exactly as written. All files deleted, both contracts created, TypeScript compiles clean.

## Tasks

| # | Name | Type | Commit | Outcome |
|---|------|------|--------|---------|
| 1 | Clear scaffold stubs and empty subdirectories | auto | `8984411` | 3 Results stubs + 4 Specific subdirectories removed; `Errors/Specific/` now has only `index.ts` |
| 2 | Create ApplicationErrorContract and RequestContext interfaces | auto | `a1667ea` | Both interfaces created with correct imports and `@/` aliases; TypeScript compiles |

## Verification Summary

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass (zero errors) |
| `application-error.contract.ts` extends `ErrorBase` | ✅ Found |
| `application-error.contract.ts` has `operationName`, `correlationId`, `userId` | ✅ All three fields present |
| `request-context.contract.ts` has `correlationId` (required) and `userId` (optional) | ✅ Both fields present |
| 3 Results stub files absent | ✅ All deleted |
| 4 Specific subdirectories absent | ✅ All removed |
| `Errors/Specific/` has zero subdirectories | ✅ Only `index.ts` remains |

## Acceptance Criteria

1. ✅ `ApplicationErrorContract` extends `ErrorBase` with `operationName: string`, `correlationId: CorrelationId`, `userId?: string` — matches D-03/D-04/D-05/D-10
2. ✅ `RequestContext` has `correlationId: CorrelationId` (required) and `userId?: string` (optional) — matches D-16
3. ✅ Zero scaffold stubs remain in `Results/` — D-12 cleanup complete
4. ✅ Zero empty subdirectories in `Errors/Specific/` — D-27 flat structure prepared
5. ✅ TypeScript compilation passes with zero errors

## Known Stubs

None — all created files are complete implementations.

## Threat Flags

None — both created files are pure type definitions with no runtime code, no network endpoints, no auth paths, and no schema changes at trust boundaries. The plan's threat model covers T-04-01 (ApplicationErrorContract) and T-04-02 (RequestContext) adequately.

## Self-Check: PASSED

All created/modified files verified for existence; both commits confirmed in git log; all acceptance criteria met.
