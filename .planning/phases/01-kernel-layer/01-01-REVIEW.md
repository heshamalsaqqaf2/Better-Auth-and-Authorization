---
phase: 01-kernel-layer
plan: 01
type: code-review
depth: standard
status: clean
files_reviewed: 10
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
reviewed_at: 2026-06-08
---

# Code Review: Phase 01 (Wave 1) — Primitives

## Files Reviewed (10)

- `tsconfig.json`
- `src/Core/Kernel/Primitives/Enums/severity.enum.ts`
- `src/Core/Kernel/Primitives/Enums/layer-type.enum.ts`
- `src/Core/Kernel/Primitives/Enums/index.ts`
- `src/Core/Kernel/Primitives/Types/correlation-id.type.ts`
- `src/Core/Kernel/Primitives/Types/error-code.type.ts`
- `src/Core/Kernel/Primitives/Types/operation-id.type.ts`
- `src/Core/Kernel/Primitives/Types/index.ts`
- `src/Core/Kernel/Primitives/index.ts`
- `src/Core/Kernel/index.ts`

---

## Findings

### WR-01: `throw new TypeError` breaks functional chain

**Severity:** Warning
**File:** `src/Core/Kernel/Primitives/Types/correlation-id.type.ts`, `error-code.type.ts`, `operation-id.type.ts`
**Lines:** 8-10 (in each file)

The three branded-type factory functions throw `TypeError` synchronously for empty-string input:

```ts
if (value.length === 0) {
  throw new TypeError('CorrelationId must be a non-empty string');
}
```

**Issue:** This pattern:
- Forces all callers to wrap factories in try/catch — cannot be caught at compile time
- Breaks the Result monad chain that Phase 2+ will establish with `ResultBase<T, E>`
- Creates inconsistent error handling: `createCorrelationId` throws, but `isCorrelationId` returns `false`

**Mitigation:** This is by-design per PRIM-03/04/05 which require `throw TypeError` on empty input. The plan explicitly encodes this constraint because Phase 1 has no `Result` type. Phase 2 (`ResultBase`) should wrap these factories:

```ts
// Phase 2+ future pattern:
function createCorrelationId(value: string): Result<CorrelationId, ValidationError> {
  return value.length === 0
    ? err(new ValidationError(...))
    : ok(value as CorrelationId);
}
```

---

### WR-02: Pre-existing type errors from `exactOptionalPropertyTypes`

**Severity:** Warning
**Files:** `src/Shared/components/ui/calendar.tsx`, `src/Shared/components/ui/sonner.tsx`
**Lines:** calendar.tsx:93,174; sonner.tsx:11

Three pre-existing errors block `npx tsc --noEmit`:

1. `calendar.tsx:93` — Object literal may only specify known properties, 'table' does not exist in type 'Partial<ClassNames>'
2. `calendar.tsx:174` — Property 'locale' incompatible with `exactOptionalPropertyTypes: true`
3. `sonner.tsx:11` — Property 'theme' incompatible with `exactOptionalPropertyTypes: true`

**Issue:** These errors were introduced by adding `"exactOptionalPropertyTypes": true` to tsconfig.json. The existing shadcn/ui components use optional properties (`theme?: ... | undefined`) which are incompatible with this strictness flag.

**Resolution:** Either:
- Add `// @ts-expect-error` to the 3 affected lines in calendar.tsx and sonner.tsx
- Or fix the property types to match `exactOptionalPropertyTypes` requirements (e.g., change `theme?: "dark" | "light" | "system"` to `theme?: "dark" | "light" | "system" | undefined` in the library types)

---

### INFO-01: `BrandedErrorCode` type alias in Types barrel

**Severity:** Info
**File:** `src/Core/Kernel/Primitives/Types/index.ts`
**Line:** 6

```ts
export type { ErrorCode as BrandedErrorCode } from "./error-code.type";
```

The `ErrorCode` branded type is re-exported as `BrandedErrorCode` to avoid collision with the future constants-derived `ErrorCode` union type (CNST-01). This means consumers get `createErrorCode` + `isErrorCode` as values but the type is named `BrandedErrorCode` in the barrel.

**Note:** This is intentional per plan — Phase 2 Wave 2 will introduce `ErrorCodes` constants object, and its derived `ErrorCode` union is designed as the primary public type. The branded variant is disambiguated via `BrandedErrorCode`.

---

### INFO-02: No tests for factory validation

**Severity:** Info
**Files:** All three `*.type.ts` files

No unit tests verify that `createCorrelationId('')`, `createErrorCode('')`, `createOperationId('')` throw `TypeError`. While testing is deferred per PROJECT.md, the throw behavior is an explicit contract requirement (PRIM-03/04/05) and is not verifiable at compile time.

**Note:** Tests are deferred to later phases per PROJECT.md ("Skip tests for Phase 1"). Phase 2+ should add test coverage for these factory validation paths.

---

## Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | 0 | — |
| Warning  | 2 | Review WR-01 (by-design), resolve WR-02 |
| Info     | 2 | Note for Phase 2+ |

**Verdict:** Code is clean for Phase 1 scope. WR-01 is by-design (per plan requirements). WR-02 is the only actionable item — fix the 3 pre-existing type errors in `calendar.tsx` and `sonner.tsx` or suppress them with `// @ts-expect-error`.
