# Plan 07-01: Boundary Configuration — Summary

**Commit:** `2f3e164`
**Date:** 2026-06-19

## Objectives
Create layer boundary enforcement config for Biome (local IDE feedback) and dependency-cruiser (CI gate) to prevent cross-layer import violations.

## Results

### Task 1: biome.json — noRestrictedImports
- Added `style.noRestrictedImports` (error-level, empty base paths) at project level
- Created 6 override groups with `includes` scoped per layer directory:
  - **Kernel**: blocks `@/Core/Foundations` — zero external dependency enforcement
  - **Base**: blocks Domain, Application, Infrastructure, Presentation
  - **Domain**: blocks Application, Infrastructure, Presentation
  - **Application**: blocks Infrastructure, Presentation
  - **Infrastructure**: blocks Domain, Presentation
  - **Presentation**: blocks Base, Domain, Infrastructure
- Each override uses verbose error messages with "Allowed imports:" phrase per D-04
- Includes both exact barrel path (`@/Core/Foundations/Domain`) and deep glob (`@/Core/Foundations/Domain/**`) patterns
- All existing config fields (formatter, vcs, files, assist, linter.domains) preserved unchanged
- Validated: `npx biome lint` scans 207 files with no config errors — all reported errors are pre-existing

### Task 2: .dependency-cruiser.js
- Created CommonJS config with 7 forbidden rules:
  - 6 layer boundary rules (Kernel, Base, Domain, Application, Infrastructure, Presentation) — each uses `from.path` + `to.pathNot` allow-list approach
  - 1 circular dependency rule (`from.path: ^src/Core/` with `to: { circular: true }`)
- All rules scoped to `src/Core/` per D-02 internal-layers-only
- `severity: "error"` on all rules (CI-blocking)
- No madge config (D-01 compliance)
- Validated: `node -e "require('./.dependency-cruiser.js')"` — 7 rules, no parse errors

## Key Observations
- All 3 architecturally-correct mapper files (Application→Domain, Infrastructure→Application, Presentation→Application) are NOT flagged by either tool — they correctly fall within the per-D-02 allow-lists, no special exceptions needed
- Current codebase produces zero false positives from either config
