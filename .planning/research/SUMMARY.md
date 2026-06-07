# Project Research Summary

**Project:** Layered Error & Result System (authentication-better-auth)
**Domain:** TypeScript/Next.js error and result handling with Hybrid OOP + DU architecture
**Researched:** 2026-06-07
**Confidence:** HIGH

## Executive Summary

This project builds a production-grade, multi-layered Error and Result system for a Next.js 16 + Better Auth application. The system follows a Hybrid Architecture: OOP classes for inner layers (Domain, Application, Infrastructure) for behavior and polymorphism, and Discriminated Unions (plain objects with `_tag`) at the Presentation serialization boundary for safe RSC transport. The Kernel layer — implemented first with zero external dependencies — defines contracts, primitives (branded types, enums), and constants that every other layer depends on.

The recommended approach is to phase implementation strictly bottom-up by dependency: start with Kernel (pure TypeScript types and contracts), then Foundations Base (abstract classes), then layer-specific implementations (Domain, Application, Infrastructure), and finally Presentation (DUs) with cross-layer mappers. This ordering is dictated by the import dependency graph — each layer can only import from layers below it. The critical architectural invariant is that **no OOP class ever crosses the RSC serialization boundary** — Server Actions must always map to `PresentationResult<T>` DUs before returning.

Key risks include: (1) branded types silently lost during JSON serialization (mitigate by enforcing factory re-construction at every deserialization boundary), (2) OOP classes accidentally crossing RSC boundaries and losing methods at runtime (mitigate by enforcing mandatory `toPresentation()` mapping in every Server Action), (3) layer isolation violations where Domain imports Infrastructure types (mitigate by configuring `import/no-restricted-paths` in Phase 1 before any code is written), and (4) over-engineering with full monadic composition that hurts developer experience (mitigate by keeping the Result API pragmatic — `match`, `map`, `unwrapOr` — and reserving monadic chains for pure data pipelines only).

## Key Findings

### Recommended Stack

**Core language:** TypeScript ~5.7+ with strict mode and ES2022 target. Zero external dependencies for the Kernel layer per PROJECT.md constraint.

**Critical tsconfig upgrades needed from current state:**
- **`target: "ES2022"`** — unlocks `unique symbol` for branded types, `Error.cause` for error wrapping chains, and private class fields. Current `ES2017` target is insufficient.
- **`noUncheckedIndexedAccess: true`** — prevents unsafe access on branded type maps and result collections.
- **`noImplicitOverride: true`** — enforces `override` keyword on ResultBase → DomainResult/ApplicationResult hierarchy.
- **`verbatimModuleSyntax: true`** — enforces `import type` for type-only imports, keeping Kernel's zero-dependency guarantee verifiable.

**Core design decisions:**
- **Branded types:** String-tag brand with `unique symbol` key (hybrid approach). Prevents collision across modules while enabling `BrandOf<T>` utilities. Each brand has a named constructor function (the single `as` cast in the codebase).
- **Result monad:** Abstract class (`ResultBase<T, E>`) with concrete `Success`/`Failure` subclasses. Enables `instanceof` type guards and layer-specific extensions (e.g., `ApplicationResult.log()`, `InfrastructureResult.retry()`).
- **Enums:** `as const` objects with derived union types (not TypeScript `enum`). Better tree-shaking, no reverse-mapping bloat, fully tree-shakeable.
- **Presentation types:** Plain object Discriminated Unions with `_tag` discriminant — no classes, no methods, 100% JSON-serializable.
- **Discriminant name:** `_tag` (ecosystem standard from Effect/fp-ts) — avoids collision with `type` keyword.

**Full comparison of alternatives considered** is documented in STACK.md §Alternatives Considered including rejected approaches (plain string brands, full monad implementations, class wrappers, Zod/Effect dependencies).

### Expected Features

**Must have (table stakes) — all 8 required for production readiness:**
1. Branded type safety for CorrelationId, ErrorCode, OperationId
2. Layer type enums (Severity, LayerType) for error traceability
3. Monadic operations (`map`, `flatMap`, `match`, `fold`, `tap`, `tapError`)
4. Error cause chaining via `cause: ErrorBase | undefined`
5. Serializable error codes via `toJSON(): object`
6. Discriminated Union at Presentation boundary (`_tag` field)
7. Layer-specific type guards (`isDomainError`, `isApplicationError`)
8. Exhaustive match enforcement via `match`/`fold`

**Should have (differentiators) — phased across 5 phases:**
- Phase 2: Combination combinators (tuple-preserving), Generator-based composition (`Result.gen()`)
- Phase 3: Cross-layer mapper contracts, Observability hooks (`tap`/`tapError`), Audit trail
- Phase 4: Distributed tracing, Infrastructure resilience (retry, timeout, circuit breaker, fallback)
- Phase 5: PII redaction, Error registry, i18n-ready user messages

**Defer (v2+ or not building):**
- Full fp-ts/Effect ecosystem integration (too heavy for this project)
- Auto-mapping via `class-transformer` (rejected — magic behavior, runtime coupling)
- Explicitly avoided: implicit type coercion, mixing DU with methods, exposing internal types at boundaries, class-based Result at serialization boundary, throwing for expected domain errors, 100% Result coverage for pure computations, combining null/undefined with Result

**Anti-features (10 explicitly documented):** See FEATURES.md §Anti-Features for full enforcement strategy including ESLint rules, barrel export control, and code review checklists.

### Architecture Approach

The system follows a strict 5-layer architecture with one Kernel capstone layer, arranged in a dependency inversion pyramid:

```
Presentation (DU)  ← imports Application only
Application (OOP)  ← imports Domain + Kernel + Base
Domain (OOP)       ← imports Kernel + Base only
Infrastructure (OOP) ← imports Domain + Application + Kernel + Base
    Base (abstract OOP) ← imports Kernel only
    Kernel (types/enums/contracts) ← ZERO dependencies
```

**Major components:**
1. **Kernel** — Type contracts (`ErrorBase.contract`, `ResultBase.contract`), branded types (`CorrelationId`, `ErrorCode`, `OperationId`), enums (`Severity`, `LayerType`), constants (`ErrorCodes`, `LayerNames`). Zero external dependencies. Pure TypeScript.
2. **Base** — Abstract classes (`ErrorBase`, `ResultBase<T, E>`) implementing Kernel contracts with shared `toJSON()`, monadic method signatures, and `instanceof` support.
3. **Domain** — Business rule errors (`DomainError`) and results (`DomainResult<T>`) extending Base. Pure business logic — zero framework/technology coupling.
4. **Application** — Use case orchestration (`ApplicationError`, `ApplicationResult<T>`) with observability hooks (`log()`, `metrics()`, `audit()`), correlation ID propagation, and Domain→Application mappers.
5. **Infrastructure** — I/O errors (`InfrastructureError`) with sanitization, resilience methods (`retry()`, `withTimeout()`, `withCircuitBreaker()`, `withFallback()`), and OpenTelemetry integration.
6. **Presentation** — Discriminated Unions (`PresentationError` with 5 variants, `PresentationResult<T>`). Plain objects only. Application→Presentation mappers. 100% JSON-serializable.

**Key data flow:** Every request flows Client → Server Action → Application UseCase → Domain Service → Repository (Infrastructure) → DB, then back through mappers at each boundary. The critical transformation point is Application→Presentation in the Server Action, where OOP classes become serialization-safe DUs. Error propagation preserves the full `cause` chain across all layers for debugging while stripping sensitive details at each upward boundary.

**Build order is strictly dependency-driven:** Kernel → Base → Domain → Application → Infrastructure → Presentation. Within each layer, the internal order is: Error class → Contract → Validator → Type Guard → Result class → Mappers → Barrel.

### Critical Pitfalls

1. **Branded types stripped by serialization (CRIT-1):** When a `CorrelationId` crosses `JSON.parse`/RSC boundary, the compile-time brand is silently lost. TypeScript still believes it's branded, but runtime gets a plain `string`. **Prevention:** Mandatory factory/reconstruction functions for all branded types. Re-validate at every deserialization boundary. Only factory files contain `as` casts.

2. **OOP Result classes crossing RSC boundary (CRIT-2):** Returning `DomainResult` or `ApplicationResult` (with methods like `.match()`) from a Server Action — TypeScript compiles fine, but RSC serializer strips the prototype chain and all methods at runtime. **Prevention:** Enforce that every Server Action explicitly maps `ApplicationResult<T>` → `PresentationResult<T>` (DU) before returning. Add compile-time lint rules. Unit test serialization safety.

3. **Layer isolation violation — Domain importing Infrastructure (CRIT-3):** A Domain entity importing from Infrastructure creates circular dependencies, destroys portability, and voids the "swap infrastructure" promise. **Prevention:** Configure `import/no-restricted-paths` eslint rule in Phase 1 before any code exists. Run `dependency-cruiser` in CI. Domain barrel files must only re-export from Kernel.

4. **Missing PresentationError mapping leaks information (CRIT-4):** Returning `ApplicationError` with stack traces or DB hostnames directly to the client. **Prevention:** `PresentationError` is a strict DU with ONLY safe-for-client fields (no `cause`, no `stack`). Mandatory mapper step. Every Server Action must call a mapper — no inline error construction.

5. **Result monad over-engineering (HIGH-1):** Full Monad Laws (Functor, Applicative, Monad) with `bimap`, `ap`, `pipe` chains of 10+ steps creates unreadable code that TypeScript inference breaks on. **Prevention:** Stick to pragmatic Result API: `ok()`/`err()` constructors, `.match()`, `.map()`, `.unwrapOr()`. Reserve monadic composition for pure data pipelines only. Limit `pipe()` chains to 5 steps max.

## Implications for Roadmap

Based on combined research, the following phase structure is recommended. This ordering is dictated by layer dependency graph, pitfall timing, and feature value delivery.

### Phase 1: Kernel Layer — Contracts, Primitives, Constants
**Rationale:** Every other layer depends on Kernel. Zero external dependencies means pure TypeScript — no npm installs, no build tool changes needed beyond tsconfig. Import boundaries must be established now before any foundations code exists.
**Delivers:** KRNL-01 through KRNL-06 — Severity/LayerType enums, branded types (CorrelationId/ErrorCode/OperationId), ErrorBase/ResultBase contracts, validator contracts, error code constants, barrel exports.
**Addresses (FEATURES.md):** Table stakes #1 (branded types), #2 (layer enums), part of #4 (ErrorBase contract with cause chaining), part of #3 (ResultBase contract)
**Avoids (PITFALLS.md):** CRIT-1 (branded type factories defined from the start), CRIT-3 (import boundaries established via tooling), HIGH-3 (`as` casts confined to factories), HIGH-4 (barrel structure designed pre-implementation), HIGH-1 (minimal Result contract, not full monad)
**Research flag:** LOW — well-documented patterns. Core TypeScript. Skip research-phase.
**Confidence:** HIGH

### Phase 2: Foundations Base — Abstract Implementations
**Rationale:** Base depends on Kernel only. Implements the abstract classes that all OOP layers inherit from. This is where the Result monad gets real method implementations and shared `toJSON()` logic.
**Delivers:** ErrorBase abstract class with `toJSON()`, `isRecoverable()`; ResultBase abstract class with `map`, `flatMap`, `match`, `fold`, `tap`, `tapError` implementations; Base type guards and validators.
**Addresses (FEATURES.md):** Table stakes #3 (monadic operations implemented), #5 (toJSON implemented), #7 (base type guards). Differentiator #6 (combination combinators with tuple inference), #7 (generator-based composition via `Result.gen()`).
**Avoids (PITFALLS.md):** MOD-3 (over-abstraction — don't create validators/type-guards before runtime need; keep Base lean). HIGH-1 (pragmatic Result API, not full monad).
**Research flag:** MEDIUM — the generator composition pattern (`Result.gen()` with `yield*`) needs careful design. Consider a spike before full implementation.
**Confidence:** HIGH

### Phase 3: Domain Layer + Application Layer — Business Logic & Orchestration
**Rationale:** Domain depends on Kernel + Base. Application depends on Domain. These are the two "inner" OOP layers that contain the core business logic. Building them together ensures the Domain→Application mapping pattern is established correctly.
**Delivers:** `DomainError`/`DomainResult<T>` (business rule violations), `ApplicationError`/`ApplicationResult<T>` (orchestration with logging/metrics/audit), Domain→Application mapper contracts, `correlationId` propagation, use case infrastructure.
**Addresses (FEATURES.md):** Table stakes #4 (cause chaining in action), #7 (layer-specific type guards). Differentiators #1 (explicit cross-layer mappers), #2 (observability hooks), #3 (audit trail).
**Avoids (PITFALLS.md):** CRIT-3 (layer isolation — Domain cannot see Application), MOD-2 (Use Cases must use constructor injection, not direct DB calls), MOD-3 (don't over-abstract with validators that have no runtime need).
**Research flag:** LOW — well-established Clean Architecture patterns. Skip research-phase.
**Confidence:** HIGH

### Phase 4: Infrastructure Layer — I/O & Resilience
**Rationale:** Infrastructure depends on all inner layers. It's the "dirty" layer that handles DB, cache, queue, HTTP calls. Resilience features (retry, circuit breaker, timeout) require careful state machine design.
**Delivers:** `InfrastructureError` with sanitization, `InfrastructureResult<T>` with `retry()`, `withTimeout()`, `withCircuitBreaker()`, `withFallback()`, Application→Infrastructure mapper, OpenTelemetry tracing integration.
**Addresses (FEATURES.md):** Differentiators #4 (distributed tracing), #5 (retry/circuit-breaker/fallback).
**Avoids (PITFALLS.md):** CRIT-4 (errors must sanitize internals before wrapping upward). MOD-2 (Infrastructure depends on Application/Domain, not vice versa). MIN-4 (cause chain depth limited to 4).
**Research flag:** HIGH — circuit breaker pattern needs research. Options: implement simple state machine vs integrate with existing library. Need to evaluate OpenTelemetry TS SDK for tracing integration. Recommend `/gsd-plan-phase --research-phase 4` during planning.
**Confidence:** MEDIUM

### Phase 5: Presentation Layer — Serialization Boundary & Mappers
**Rationale:** Presentation depends on Application only. This is the final layer, closest to the UI. All previous layers produce OOP Results; this layer maps them to serialization-safe DUs for RSC transport. Must come last because the mapper implementations depend on understanding all error types from inner layers.
**Delivers:** `PresentationError` DU (5 variants: ValidationError, NotFoundError, AuthorizationError, SystemError, NetworkError), `PresentationResult<T>` DU, Application→Presentation mapper, PII redaction, i18n message mapping, Error registry.
**Addresses (FEATURES.md):** Table stakes #6 (Presentation DU), #8 (exhaustive match enforcement). Differentiators #8 (PII redaction), #9 (error registry), #10 (i18n messages).
**Avoids (PITFALLS.md):** CRIT-2 (mandatory mapping before RSC boundary — class instances never cross), CRIT-4 (PresentationError has ONLY safe-for-client fields), HIGH-2 (NO `class` keyword in Presentation — enforce with ESLint), MOD-1 (NO methods on DUs — behavior in standalone functions only).
**Research flag:** MEDIUM — i18n strategy needs research. Determine if we need react-i18next, next-intl, or a custom message map. Recommend research during planning.
**Confidence:** HIGH

### Phase 6: Module Integration & Server Actions
**Rationale:** All five layers exist as abstractions. This phase connects them to real Next.js Server Actions, client components, and modules. Validates the entire architecture end-to-end.
**Delivers:** Working Server Actions returning `PresentationResult<T>`, client components consuming DUs with exhaustive switch matching, error boundaries, middleware hooks for correlation propagation.
**Avoids (PITFALLS.md):** CRIT-2 (the critical "OOP crosses boundary" violation is now prevented by architecture — Presentation layer exists), MOD-3 (avoid creating per-module validators until runtime need is proven).
**Research flag:** MEDIUM — Next.js 16 Server Action + RSC serialization behavior may have edge cases. Test early.
**Confidence:** MEDIUM

### Phase Ordering Rationale

- **Kernel first** — strictly necessary: every other layer depends on it. Zero dependencies means zero friction to start.
- **Base before Domain** — Domain classes extend Base abstract classes. Cannot implement Domain without Base.
- **Domain before Application** — Application wraps Domain errors. Must exist first.
- **Infrastructure parallel-ish** — Infrastructure can be built alongside Application, but must not block Application layer implementation (use interface stubs).
- **Presentation last** — depends on Application for mapping. Cannot implement correctly without understanding all inner error types.
- **Module integration final** — validates the architecture works end-to-end. Defer until all layers have stable APIs.

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (Infrastructure):** Circuit breaker state machine, retry with backoff strategies, OpenTelemetry SDK integration. These are non-trivial designs with multiple viable approaches.
- **Phase 2 (Base):** The `Result.gen()` generator-based composition pattern. Need to validate the `yield*` approach works ergonomically with TypeScript 5.7+ and doesn't create inference issues.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Kernel):** Pure TypeScript patterns. Branded types, `as const` enums, interface contracts. Well-documented in TS Handbook.
- **Phase 3 (Domain + Application):** Standard Clean Architecture. Repositories, Use Cases, DTOs. Established patterns.
- **Phase 5 (Presentation):** Discriminated Unions are standard TypeScript. PII redaction is straightforward filtering.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | TypeScript 5.7+ capabilities verified against official docs. All patterns are pure TypeScript — no ecosystem dependencies to validate. |
| Features | HIGH | Verified against neverthrow, Effect, better-result, verdict-ts, ts-safe-result, @kitiumai/error documentation and comparison. All 8 table stakes confirmed across multiple sources. |
| Architecture | HIGH | Directly from project's own Base_System.md and Architecture.md specs. RSC serialization constraints verified against Next.js 16 docs. Layer isolation patterns are standard Clean Architecture. |
| Pitfalls | HIGH | 15 of 19 pitfalls verified by multiple production post-mortems. 4 moderate/minor pitfalls confirmed by single source with supporting reasoning. All critical pitfalls have actionable prevention strategies. |

**Overall confidence:** HIGH — but with two important caveats: (1) the circuit breaker/resilience features in Phase 4 need deeper research on implementation approach, and (2) the generator-based composition pattern in Phase 2 needs a validation spike before committing to it.

### Gaps to Address

1. **CI Tooling Setup:** No CI pipeline, linting, or dependency checking exists yet. Phase 1 must include setting up `dependency-cruiser`, ESLint `import/no-restricted-paths`, and `madge` for circular dependency detection. Without these tools, layer isolation violations will happen in Phase 3+ and require painful refactors.

2. **Error cause chain circularity detection:** MIN-4 mentions detecting circular cause chains but no implementation guidance exists in the specs. This should be added to the ErrorBase `toJSON()` implementation in Phase 2 (or as a runtime check in the constructor).

3. **ES2022 target compatibility:** STACK.md §Open Questions flags whether Next.js 16's build pipeline handles ES2022 output. Must verify before committing to ES2022 target. If incompatible, fall back to ES2020 (minimum for `Error.cause`).

4. **Testing strategy:** PROJECT.md defers tests, but the system has architectural invariants that can only be validated through tests (serialization safety, cause chain preservation, layer isolation). Phase 1 should at minimum include import-boundary validation scripts.

5. **Composition Root maturity:** The scaffolded Composition Root exists but is empty. Application Use Cases need constructor injection to work. The Composition Root must be fleshed out before or alongside Phase 3.

## Sources

### Primary (HIGH confidence)
- **Project specs**: `docs/Base_System.md`, `docs/Architecture.md`, `.planning/PROJECT.md` — Primary source of truth for architecture, contracts, and phase definitions
- **TypeScript Handbook** — `as const` vs `enum`, discriminated unions, TypeScript strict mode options
- **Next.js 16 Documentation** — Server Action return types, RSC serialization rules, error boundaries
- **ES2022 Specification** — `Error.cause`, `unique symbol`, private class fields
- **Total TypeScript TSConfig Cheat Sheet** — Recommended strictness flags and their trade-offs

### Secondary (MEDIUM confidence)
- **neverthrow** — Result monad implementation patterns (map, flatMap, match, tap)
- **better-result** — Generator-based composition pattern (`Result.gen()`)
- **verdict-ts** — Plain object Result types, tuple-preserving combinators
- **@kitiumai/error** — Error registry, PII redaction, i18n, OpenTelemetry integration patterns
- **ts-safe-result** — Cross-realm type guards, AsyncResult patterns
- **Stanza Discriminated Unions Guide** — DU naming conventions and pattern matching
- **DEV Community guides** — Branded type comparisons (unique symbol vs string tag)
- **PkgPulse ecosystem comparison** — neverthrow vs Effect vs oxide.ts feature comparison
- **Production post-mortems** — Clean Architecture anti-patterns, Monad over-engineering, RSC serialization pitfalls
- **CapsuleRSC** — 3-layer serialization defense (type/build/runtime) for RSC boundaries
- **BSWEN Layered Error Handling** — isRetryable flags, sanitization patterns, cause chain architecture

### Tertiary (LOW confidence)
- **TC39 Error.native / Result proposal status** — Current stage, unlikely to be stable before project completion
- **Effect v4 bundle size claims** — Needs official verification
- **Neverthrow maintenance status** — Library may be "done" not abandoned; functional but not actively developed

---

*Research completed: 2026-06-07*
*Ready for roadmap: yes*
