---
phase: 06-presentation-layer
plan: 01
subsystem: presentation
tags: [types, discriminated-union, presentation, error-handling, cleanup]
requires:
  - phase: 04-application-layer
    provides: ApplicationError class hierarchy, fieldErrors type pattern
provides:
  - PresentationError 5-variant discriminated union
  - 5 standalone factory functions
  - Clean Errors/ directory (stubs removed)
  - Types separated from runtime (file-split pattern)
affects: [06-02, 06-03, 06-04]
tech-stack:
  added: []
  patterns:
    - "Discriminated union with _tag discriminant for RSC-safe serialization"
    - "Standalone factory functions per variant (plain object return)"
    - "Types separated from runtime — .types.ts for shapes/union, .ts for factories"
key-files:
  created:
    - src/Core/Foundations/Presentation/Errors/presentation-error.types.ts (shapes + union)
    - src/Core/Foundations/Presentation/Errors/presentation-error.ts (factories only)
  modified:
    - src/Core/Foundations/Presentation/Errors/index.ts (barrel updated)
  deleted:
    - presentation-error.contract.ts
    - presentation-error.validator.ts
    - presentation-error.type-guard.ts
    - Specific/ (entire tree: 3 subdirectories, 6 files, 1 index.ts)
key-decisions:
  - "D-06 upheld: errorCode: string on all 5 variants for uniform monitoring"
  - "D-04 upheld: no requiredPermission on AuthorizationError"
  - "D-05 upheld: NetworkError is minimal {_tag, errorCode, userMessage, retryable}"
  - "D-16 upheld: all OOP stubs deleted"
  - "Types separated from factories — follows Contracts/{layer}-error.ts pattern used by Application/Infrastructure/Domain layers"
requirements-completed: [PRES-01]
duration: ~5 min
completed: 2026-06-17
---

# Phase 6 Plan 1: Types & Cleanup Summary

**PresentationError 5-variant DU with factory functions — OOP stubs deleted, types separated from runtime**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-17T~12:00Z
- **Completed:** 2026-06-17T~12:05Z
- **Tasks:** 4
- **Files modified:** 13 (10 deleted, 2 created, 1 modified)

## Accomplishments

- Deleted 10 scaffold stubs (contract, validator, type-guard, 6 Specific/) + 3 category directories (D-16 compliance)
- Created `presentation-error.types.ts` — 5 variant shapes + `PresentationError` union (types only, zero runtime)
  - `ValidationErrorShape` — `_tag: 'ValidationError'`, `fieldErrors: Record<string, string[]>`
  - `NotFoundErrorShape` — `_tag: 'NotFoundError'`, `suggestedAction?: string`
  - `AuthorizationErrorShape` — `_tag: 'AuthorizationError'`, no `requiredPermission` (D-04)
  - `SystemErrorShape` — `_tag: 'SystemError'`, `severity: 'warning' | 'error' | 'critical'`
  - `NetworkErrorShape` — `_tag: 'NetworkError'`, `retryable: boolean`
- Created `presentation-error.ts` — 5 standalone factory functions (runtime only, imports types)
- Added `errorCode: string` to all 5 variants (D-06)
- Updated `Errors/index.ts` barrel to expose both types and factories
- TypeScript compilation clean (`tsc --noEmit`)

## Task Commits

All changes committed atomically in `f9b3751`. Post-review refactor (split types into separate file) applied as working-tree change.

## Files Created/Modified

- `Errors/presentation-error.types.ts` — 5 shapes + union (types only)
- `Errors/presentation-error.ts` — 5 factory functions (runtime only)
- `Errors/index.ts` — barrel re-exports from both

## Decisions Made

All decisions from 06-CONTEXT.md honored:
- D-01: `fieldErrors: Record<string, string[]>` on ValidationErrorShape
- D-02: `severity` is plain string union (not Severity enum) for serialization safety
- D-03: `suggestedAction?: string` optional on NotFoundErrorShape
- D-04: No `requiredPermission` on AuthorizationErrorShape
- D-05: NetworkErrorShape is minimal (no statusCode, no retryAfter)
- D-06: `errorCode: string` on all 5 variants
- D-09: Standalone factory functions per variant
- D-16: Aggressive stub cleanup

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `exactOptionalPropertyTypes: true` required conditional spread for `suggestedAction?` in `createNotFoundError` factory — fixed with `...(suggestedAction !== undefined ? { suggestedAction } : {})`

## Next Wave Readiness

Ready for 06-02 (PresentationResult DU) — Errors layer is clean, types separated from factories, DU-ready.
