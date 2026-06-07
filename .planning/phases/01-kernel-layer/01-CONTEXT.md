# Phase 1: Kernel Layer - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning
**Source:** Manual extraction from specs (docs/Architecture.md, docs/Base_System.md)

<domain>
## Phase Boundary

**What Phase 1 delivers:** Typed primitives (enums + branded types), contract interfaces, and constants that define the error/result system's vocabulary. This is the Kernel layer — the framework-agnostic foundation with zero external dependencies that all other layers depend on.

**What Phase 1 does NOT deliver:**
- Abstract class implementations (Base layer — Phase 2)
- Domain errors/results (Phase 3)
- Application errors/results with observability (Phase 4)
- Infrastructure errors/results with resilience (Phase 5)
- Presentation DUs (Phase 6)
- Cross-layer mappers — deferred
- Tests — deferred

</domain>

<decisions>
## Implementation Decisions

### Enums (Primitives)
- `as const` objects for enums (not TypeScript `enum` keyword) — better tree-shaking, no reverse-mapping bloat (from STATE.md)
- `Severity` enum values: `critical`, `error`, `warning`, `info`
- `LayerType` enum values: `domain`, `application`, `infrastructure`, `presentation`

### Branded Types (Primitives)
- Unique-symbol branded types with named factory functions — single `as` cast per factory (from STATE.md)
- `CorrelationId` — branded string, factory validates non-empty
- `ErrorCode` — branded string, factory validates non-empty
- `OperationId` — branded string, factory validates non-empty

### Contract Interfaces
- `ErrorBase` follows Base_System.md §2.1: `code`, `message`, `timestamp`, `layer`, `cause`, `toJSON()`, `isRecoverable()`, `getSeverity()`
- `ResultBase<T, E>` follows Base_System.md §3.1: `isSuccess`, `isFailure`, `data`, `error`, `map()`, `flatMap()`, `mapError()`, `match()`, `fold()`, `tap()`, `tapError()`
- Validator contracts follow Base_System.md §5.3: LayerValidator, ErrorValidator, ResultValidator

### Constants
- Error codes as `as const` object with derived union type (per Base_System.md §7 file structure)
- Layer names as `as const` object with derived union type

### Public API
- Barrel exports at each subdirectory level (Base_System.md §7 structure)
- Top-level barrel from `src/Core/Kernel/index.ts`

### Architecture Constraints
- ES2022 target needed for `unique symbol`, `Error.cause`, private fields (from STATE.md)
- Zero external dependencies for Kernel — pure TypeScript only
- Import boundary: Kernel must depend on nothing (Architecture.md §6)
- Naming: `*.contract.ts`, `*.enum.ts`, `*.type.ts`, `*.constants.ts` conventions (Architecture.md §7 + Base_System.md §7)

### the agent's Discretion
- Exact factory function signatures (return types, parameter validation patterns)
- Whether to use Zod or simple if-guards for branded type validation
- Whether ResultBase contract needs `mapError` alongside `map`/`flatMap`/`match`/`fold`
- ErrorBase contract — whether `cause` should be optional (`undefined` for root errors)
- Barrel export organization within subdirectories

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Specification
- `docs/Architecture.md` — Hybrid Architecture rules, layer boundaries, data flow, folder structure, forbidden/mandatory rules
- `docs/Base_System.md` — Complete spec for 4-layer error/result system, contracts, transformation strategy, file structure

### Project Planning
- `.planning/ROADMAP.md` — Phase definitions, success criteria, dependencies
- `.planning/REQUIREMENTS.md` — Requirement IDs (PRIM-01..05, CONT-01..05, CNST-01..02, API-01..02) mapped to Phase 1
- `.planning/STATE.md` — Current position, decisions, deferred items
- `.planning/PROJECT.md` — Core value, constraints, key decisions

### Scaffolded Code
- `src/Core/Kernel/` — Empty scaffold files ready to be implemented (Primitives/Enums, Primitives/Types, Contracts/Base, Contracts/Validators, Constants)

</canonical_refs>

<specifics>
## Specific Ideas

- `Severity` and `LayerType` enums as `as const` objects with value arrays for runtime iteration
- `CorrelationId` factory: `createCorrelationId(value: string): CorrelationId` — validates non-empty string
- `ErrorCode` factory: `createErrorCode(value: string): ErrorCode` — validates non-empty string
- `OperationId` factory: `createOperationId(value: string): OperationId` — validates non-empty string
- `ErrorBase` contract interface with all required properties and methods
- `ResultBase<T, E>` generic contract interface with monadic operations
- Validator interfaces that verify contract compliance at runtime
- Error codes constants as `as const` with derived `ErrorCode` union type
- Layer names constants as `as const` with derived `LayerName` union type
- Barrel exports at every subdirectory + top-level Kernel `index.ts`

</specifics>

<deferred>
## Deferred Ideas

- Abstract class implementations of ErrorBase/ResultBase — Phase 2
- Domain-specific errors (UserNotFound, etc.) — Phase 3
- Application errors with observability — Phase 4
- Infrastructure errors with retry/timeout — Phase 5
- Presentation DUs — Phase 6
- Cross-layer mappers — Phase 6
- Tests — informed by PROJECT.md (explicitly deferred)
- ESLint rules for layer isolation — Phase 7
- Dependency cruiser config — Phase 7

</deferred>

---

*Phase: 01-kernel-layer*
*Context gathered: 2026-06-07 via manual spec extraction*
