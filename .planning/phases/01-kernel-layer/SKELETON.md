# Walking Skeleton — Layered Error & Result System

**Phase:** 1
**Generated:** 2026-06-07

## Capability Proven End-to-End

A developer can import the Kernel barrel (`@/Core/Kernel`) and use typed primitives (Severity, CorrelationId), contract interfaces (ErrorBase, ResultBase), and constants (ErrorCodes) to build type-safe, traceable errors — with zero external dependencies.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Type System | TypeScript 5.7+ with strict mode | Type safety for all layers; branded types prevent mixing identifiers at compile time |
| Enum Pattern | `as const` objects (not `enum` keyword) | Better tree-shaking, no reverse-mapping bloat, works with `isolatedModules` |
| Branded Type Pattern | Unique-symbol branded types with named factory functions | Cross-module collision prevention in layered architecture; single `as` cast per factory |
| Validation Pattern | Simple if-guards (no Zod) | Zero-dep constraint — Kernel is pure TypeScript, validation is simple non-empty checks |
| Layer Architecture | Kernel → Base → Domain → Application → Infrastructure → Presentation | Strict dependency direction: inner layers know nothing of outer layers |
| Compilation Target | ES2022 | Required for `unique symbol`, `Error.cause`, private fields |
| File Naming Convention | `*.enum.ts`, `*.type.ts`, `*.contract.ts`, `*.constants.ts` | Self-documenting file roles; consistent across all layers |
| Directory Layout | Feature-grouped under `src/Core/Kernel/{Primitives,Contracts,Constants}` | Mirrors layered architecture; each subdirectory has its own barrel export |
| Public API | Barrel exports at every subdirectory → top-level `index.ts` | Single import path for consumers; controlled API surface |
| Package Management | Zero external dependencies for Kernel | Pure TypeScript foundation — no runtime dependencies |
| Testing | Deferred to later phases | Phase 1 validates via compile-time type checking (`npx tsc --noEmit`) |

## Stack Touched in Phase 1

- [x] TypeScript 5.7+ — target ES2022, strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, `exactOptionalPropertyTypes`
- [x] Kernel layer directory structure (`src/Core/Kernel/`) with 19 scaffold files across Primitives, Contracts, and Constants
- [x] `src/Core/Kernel/Primitives/` — enums (Severity, LayerType) + branded types (CorrelationId, ErrorCode, OperationId)
- [x] `src/Core/Kernel/Contracts/` — ErrorBase, ResultBase, LayerValidator, ErrorValidator, ResultValidator interfaces
- [x] `src/Core/Kernel/Constants/` — ErrorCodes, LayerNames as const objects with derived union types
- [x] Full barrel export chain — subdirectory barrels → top-level `src/Core/Kernel/index.ts`
- [ ] Compilation: `npx tsc --noEmit` passes with zero type errors (verified at phase gate)

## Out of Scope (Deferred to Later Slices)

- Abstract class implementations of ErrorBase/ResultBase — Phase 2 (Base layer)
- Domain-specific errors (UserNotFoundError, etc.) — Phase 3
- Application errors with observability — Phase 4
- Infrastructure errors with retry/timeout — Phase 5
- Presentation discriminated unions — Phase 6
- Cross-layer mappers — Phase 6
- Tests — Phase 2+
- Dependency-cruiser / ESLint layer enforcement — Phase 7

## Subsequent Slice Plan

- Phase 2: Abstract base classes implementing Kernel contracts with monadic behavior and `toJSON()` serialization
- Phase 3: Domain-specific error and result classes carrying business rule semantics
- Phase 4: Application use case orchestration with observability hooks and cross-layer mapping
- Phase 5: Infrastructure I/O handling with retry, timeout, sanitization, and circuit breaker
- Phase 6: Presentation-layer serialization-safe discriminated unions for RSC transport
- Phase 7: Layer isolation enforcement via tooling and CI
- Phase 8: End-to-end validation in real Next.js Server Actions
