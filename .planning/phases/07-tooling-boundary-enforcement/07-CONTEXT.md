# Phase 7: Tooling & Boundary Enforcement — Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

**What Phase 7 delivers:** Layer isolation enforcement via dependency-cruiser (CI + pre-push), Biome `noRestrictedImports` rules (local IDE feedback), serialization safety tests (vitest), husky pre-commit hooks, GitHub Actions CI pipeline, and vitest test infrastructure.

**What Phase 7 does NOT deliver:**
- Module-level Server Action integration — deferred to Phase 8
- End-to-end integration tests — deferred to Phase 8
- Error boundary React components — deferred to Phase 8
- Production monitoring/logging infrastructure — out of scope per PROJECT.md
- CORS, rate limiting, or API gateway rules — out of scope
- Dependency upgrades beyond what's needed for Phase 7 tooling — not a cleanup phase
- Changes to the Foundations barrel (`Foundations/index.ts` stays Base-only) — user decision D-12
</domain>

<decisions>
## Implementation Decisions

### D-01: Tooling Stack
- **dependency-cruiser v16 LTS** for both layer boundary enforcement AND circular dependency detection
- **madge NOT installed** — depcruiser covers circular deps; no overlap needed
- **vitest** for serialization safety tests (dedicated `vitest.config.ts`)
- No additional linting tools — Biome handles lint/format, depcruiser handles architecture

### D-02: dependency-cruiser Config — Enforcement Approach
- **Allow-list per layer** — each layer declares exactly which other layers it may import from
  - Kernel → (no imports — zero external dependencies)
  - Base → Kernel only
  - Domain → Kernel, Base only
  - Application → Kernel, Base, Domain only
  - Infrastructure → Kernel, Base, Application only
  - Presentation → Kernel, Application only
- Imports not in the allow-list are CI-blocking failures
- **Internal layers only enforcement** — rules only apply within `src/Core/Foundations/` and `src/Core/Kernel/`; app code (`src/app/`, `src/Shared/`, etc.) can import from Core freely
- **Changed-files locally, full scan in CI** — pre-push hook runs depcruise on changed files only; GitHub Actions runs full scan

### D-03: dependency-cruiser Config — Circular Deps
- depcruiser's built-in circular dependency detection enabled globally within `src/Core/`
- Cycle threshold: any cycle = failure (no exceptions — cycles are architectural debt)

### D-04: Biome `noRestrictedImports` — Scope
- **All 5 layers protected equally** — blocks cross-layer violations in every Foundation layer
- Covers both `@/Core/...` alias imports AND relative path imports
- Verbose error messages with rationale: `"[source layer] cannot import from [target layer]. Allowed imports: [list]. See docs/Architecture.md for layer rules."`
- Rules are IDE feedback — the primary gate is depcruiser in CI. Biome catches issues during development before commit.

### D-05: Biome `noRestrictedImports` — Rule Configuration
- Restriction groups mirror the allow-list from D-02
- Each layer gets its own `noRestrictedImports` entry blocking all non-allowed source prefixes
- Mapper files that do architecturally-correct cross-layer imports (e.g., `Application/Mappers/domain-to-application-error.mapper.ts`) must be allow-listed in Biome config to avoid false positives
- Allow-list by file glob pattern, not by disabling per-line

### D-06: CI Pipeline — GitHub Actions
- **Platform:** GitHub Actions
- **Trigger:** On every push to any branch (catches issues early)
- **Node version:** 20.x (LTS, compatible with Next.js 16)
- **Steps:**
  1. `pnpm install --frozen-lockfile`
  2. `pnpm lint` (Biome check)
  3. `pnpm type-check` (`tsc --noEmit`)
  4. `pnpm depcruise:check` (full depcruise scan on all files)
  5. `pnpm test` (vitest serialization safety tests)

### D-07: Pre-commit Hooks — husky
- **System:** husky v9
- **pre-commit hook:** `pnpm lint-staged` — Biome lint + format on staged files only (fast, catches formatting/lint issues before commit)
- **pre-push hook:** `pnpm depcruise:changed` — depcruise on changed files only (catches boundary violations before push)
- `lint-staged` configured in `package.json` or `lint-staged.config.js`

### D-08: Serialization Safety Tests — Vitest
- **Framework:** vitest (install as devDependency)
- **Config:** `vitest.config.ts` at project root, extending tsconfig paths for `@/` alias resolution
- **Coverage:**
  1. No prototype leak — verify `Object.getPrototypeOf(result) === Object.prototype` for all PresentationError variants and PresentationResult
  2. JSON round-trip — `JSON.stringify` → `JSON.parse` preserves object shape for all variants
  3. All 5 variants covered — test each `_tag` variant individually
  4. `_tag` discriminant preservation — verify `_tag` is correct after serialization/deserialization
- **Location:** Colocated tests — `src/Core/Foundations/Presentation/__tests__/`
- **Test command:** `pnpm test` → `vitest run`

### D-09: Package Scripts
New scripts to add to `package.json`:
- `"test": "vitest run"` — run all tests
- `"test:watch": "vitest"` — watch mode for development
- `"depcruise": "depcruise src"` — run dependency-cruiser
- `"depcruise:check": "depcruise src --output-type dot | grep -q error"` — CI-friendly failure check
- `"type-check": "tsc --noEmit"` — already exists conceptually but not as a script
- `"prepare": "husky"` — husky install on `pnpm install`

### D-10: Foundational/index.ts — No Change
- `Foundations/index.ts` keeps exporting `Base` only (as it currently does)
- Phase 6 (Presentation), Phase 5 (Infrastructure), Phase 4 (Application), Phase 3 (Domain) consumers import directly from their own `index.ts` barrels
- This decision may be revisited in Phase 8 if integration patterns demand it

### D-11: Vitest DevDependencies
- `vitest` latest stable
- No additional test libraries needed — pure TypeScript safety tests don't need jsdom, React testing library, etc.
- `@types/node` already present (for `describe`/`it` if using vitest's global API)

### Architecture Constraints (carried from prior phases)
- Zero external dependencies for Foundation layers — pure TypeScript only (does not apply to tooling/test deps)
- Import boundary rules per D-02 (allow-list per layer)
- ES2022+ target
- Duck typing for validators and type guards
- Barrel chain: each subdirectory `index.ts` → parent `index.ts`

### Agent's Discretion
- Exact `dependency-cruiser` rule syntax (regex patterns for allow-list)
- Exact Biome `noRestrictedImports` configuration syntax and file glob patterns
- Exact husky hook script content
- Exact `vitest.config.ts` content
- Exact `lint-staged` configuration
- Exact GitHub Actions YAML workflow name and job structure
- Exact file naming for the serialization safety test files (e.g., `serialization-safety.test.ts`)
- Exact package.json script names and argument format
- Order of CI steps beyond the defined sequence
</decisions>

<specifics>
## Specific Ideas

- `dependency-cruiser` config uses regex patterns to allow-list imports per layer, e.g.:
  - `^src/Core/Kernel` (allowed by all layers)
  - `^src/Core/Foundations/Base` (allowed by Domain, Application, Infrastructure)
  - `^src/Core/Foundations/Domain` (allowed by Application, Infrastructure)
  - `^src/Core/Foundations/Application` (allowed by Infrastructure, Presentation)
- Mapper exceptions defined as separate allow-list entries with stricter path patterns
- Biome `noRestrictedImports` in `biome.json` uses `"linter.rules.style.noRestrictedImports"` with `"paths"` mapping
- GitHub Actions workflow file: `.github/workflows/ci.yml`
- Husky v9 uses `.husky/` directory with `pre-commit` and `pre-push` executable scripts
- `lint-staged` config can live in `package.json` or `lint-staged.config.js`
- vitest config uses `defineConfig` and resolves `@/` via `resolve.alias`
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, import boundaries, data flow
- `.planning/codebase/ARCHITECTURE.md` — Existing architecture audit, layer responsibilities
- `.planning/codebase/STACK.md` — Technology stack (Biome 2.4.16, TypeScript ^5, pnpm, Node 18+)
- `.planning/codebase/STRUCTURE.md` — Current file layout

### Existing Config Files (to be modified)
- `biome.json` — Add `noRestrictedImports` rules to `linter.rules.style`
- `package.json` — Add scripts, devDependencies, lint-staged config, husky prepare
- `tsconfig.json` — Reference for path aliases (used in vitest config and depcruise)

### Existing Source (reference for boundary analysis)
- `src/Core/Kernel/index.ts` — No external imports (zero-dep reference)
- `src/Core/Foundations/Domain/Errors/domain-error.ts` — Example of correct Domain→Kernel+Base import boundary
- `src/Core/Foundations/Application/Mappers/domain-to-application-error.mapper.ts` — Example of architecturally-correct Application→Domain import (needs allow-list)
- `src/Core/Foundations/Infrastructure/Mappers/infrastructure-to-application-error.mapper.ts` — Example of correct Infrastructure→Application import
- `src/Core/Foundations/Presentation/Mappers/application-to-presentation-error.mapper.ts` — Example of correct Presentation→Application import
- `src/Core/Foundations/Presentation/Errors/presentation-error.types.ts` — PresentationError DU (target of serialization tests)

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria for Phase 7
- `.planning/STATE.md` — Current position, accumulated decisions
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Requirement traceability

### Target Files (to create)
- `.dependency-cruiser.js` — NEW: depcruiser configuration
- `biome.json` — UPDATE: add noRestrictedImports rules
- `package.json` — UPDATE: add scripts, devDeps, husky, lint-staged
- `vitest.config.ts` — NEW: vitest configuration
- `src/Core/Foundations/Presentation/__tests__/serialization-safety.test.ts` — NEW: tests
- `.github/workflows/ci.yml` — NEW: CI pipeline
- `.husky/pre-commit` — NEW: husky pre-commit hook
- `.husky/pre-push` — NEW: husky pre-push hook

### Files to RETAIN (no change)
- `Foundations/index.ts` — stays Base-only per D-10
- All existing layer source files — no functional changes in Phase 7
</canonical_refs>

<code_context>
## Existing Code Insights

### Current Tooling
- Biome 2.4.16 with basic config (recommended rules + Next.js/React domains)
- No testing framework installed
- No CI pipeline
- No git hooks
- No dependency analysis tools

### Import Patterns
- All layers use `@/Core/Kernel/...` for Kernel imports
- Relative `../../Layer/SubModule/file` for cross-layer mapper imports
- Relative `../sub-module/file` for sibling access within same layer
- All current imports are architecturally correct (no violations)
- See `canonical_refs` for specific file examples of each pattern

### Barrel Chain
```
src/Core/Kernel/index.ts
src/Core/Foundations/index.ts (exports Base only)
  ├── Base/index.ts
  ├── Domain/index.ts (not re-exported from Foundations)
  ├── Application/index.ts (not re-exported from Foundations)
  ├── Infrastructure/index.ts (not re-exported from Foundations)
  └── Presentation/index.ts (not re-exported from Foundations)
```

### Integration Points
- `biome.json` needs `noRestrictedImports` added to existing linter config
- `package.json` needs new scripts + devDependencies hooking CI/test/depcruise into existing workflow
- No existing test infrastructure to conflict with (vitest is fresh install)
</code_context>

<deferred>
## Deferred Ideas

- **Module-level Server Action boundary tests** — Phase 8 will test the full layer stack end-to-end; serialization safety tests in Phase 7 cover the Presentation layer only
- **CI matrix testing across Node versions** — D-06 uses Node 20.x only; add matrix if cross-version compatibility becomes a concern
- **Coverage thresholds in vitest** — Phase 7 tests are narrow (serialization safety only); widespread coverage requirements deferred to module phases
- **Dependabot or Renovate** — Automated dependency updates out of scope; manage manually or add later
- **Bundle analysis** (size-limit, webpack-bundle-analyzer) — Not related to boundary enforcement; defer
- **Husky hook for type-check** — D-07 chose lint-staged only for pre-commit; type-check is fast enough to run manually or in CI

### Reviewed Todos (not folded)
- None — all prior phase deferred items (testing, module-specific UI) remain deferred to their respective phases
</deferred>

---

*Phase: 07-tooling-boundary-enforcement*
*Context gathered: 2026-06-19*
