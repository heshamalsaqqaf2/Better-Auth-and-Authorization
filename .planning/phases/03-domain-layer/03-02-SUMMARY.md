# Plan 03-02 Summary — Specific Errors + Validators

**Wave:** 2
**Date:** 2026-06-08

## Objective
Create specific domain error subclasses (ComplaintNotFoundError, ComplaintAlreadyExistsError, UserNotFoundError), DomainErrorValidator, and isDomainError type guard.

## Tasks

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | ComplaintNotFoundError | `Errors/Specific/complaint-not-found.error.ts` | ✓ |
| 2 | ComplaintAlreadyExistsError | `Errors/Specific/complaint-already-exists.error.ts` | ✓ |
| 3 | UserNotFoundError | `Errors/Specific/user-not-found.error.ts` | ✓ |
| 4 | DomainErrorValidator | `Errors/domain-error.validator.ts` | ✓ |
| 5 | isDomainError type guard | `Errors/domain-error.type-guard.ts` | ✓ |

## Verification
- `npx tsc --noEmit` — exits 0, zero errors

## Decisions
- All three specific error classes follow identical pattern: extend `DomainError`, hardcoded code in `super()`, no `override` on inherited methods
- `DomainErrorValidator` implements `ErrorValidator<DomainErrorContract>` with duck-typing checks for `layer === DOMAIN`, `businessRule` non-empty string, and `aggregateId` string
- `isDomainError()` duck-types `businessRule` + `aggregateId` properties — no `instanceof`
- Existing `ComplaintErrors/` and `UserErrors/` stub directories left untouched (Wave 3 handles collapse)
- Barrels not updated in this wave (Wave 3 handles barrel chain)

## Commit Log
- Individual commits per task (5 commits)
