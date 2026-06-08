# Roadmap: Layered Error & Result System

## Overview

Build a production-grade, multi-layered Error and Result system for a Next.js 16 + Better Auth application following a Hybrid Architecture: OOP classes for inner layers (Domain, Application, Infrastructure) for behavior and polymorphism, and Discriminated Unions (plain objects with `_tag`) at the Presentation serialization boundary for safe RSC transport. Starting with the Kernel layer (zero external dependencies) as the type-safe foundation, then building up through Base, Domain, Application, Infrastructure, Presentation, and finally integrating into real Server Actions — ensuring every error is typed, traceable to its origin layer, and safely serializable across the network boundary.

## Phases

- [x] **Phase 1: Kernel Layer** ✅ — Typed primitives, contracts, and constants that define the error/result system's vocabulary — 14 requirements covered, 0 external dependencies, `npx tsc --noEmit` clean
- [ ] **Phase 2: Foundations Base Layer** — Reusable abstract classes implementing Kernel contracts with full monadic behavior
- [ ] **Phase 3: Domain Layer** — Business rule errors and results carrying domain semantics
- [ ] **Phase 4: Application Layer** — Use case orchestration with observability hooks and cross-layer mapping
- [ ] **Phase 5: Infrastructure Layer** — Resilient I/O error handling with retry, timeout, and sanitization
- [ ] **Phase 6: Presentation Layer** — Serialization-safe discriminated unions for RSC transport
- [ ] **Phase 7: Tooling & Boundary Enforcement** — Layer isolation enforcement via tooling and CI
- [ ] **Phase 8: Module Integration & Server Actions** — End-to-end architecture validation in real Server Actions

## Phase Details

### Phase 1: Kernel Layer
**Goal**: Developers have typed primitives, contracts, and constants that define the error/result system's vocabulary — with zero external dependencies
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CNST-01, CNST-02, API-01, API-02
**Success Criteria** (what must be TRUE):
  1. Developer can import `Severity` and `LayerType` enums and use them to classify errors by severity and origin layer
  2. Developer can create `CorrelationId`, `ErrorCode`, and `OperationId` branded values via factory functions, and invalid inputs are rejected at construction
  3. Developer can implement the `ErrorBase` contract interface on error classes and satisfy all required properties and methods (`code`, `message`, `timestamp`, `layer`, `cause`, `toJSON`, `isRecoverable`, `getSeverity`)
  4. Developer can implement the `ResultBase<T, E>` contract interface and use monadic operations (`map`, `flatMap`, `match`, `fold`, `tap`, `tapError`)
   5. Developer can import all Kernel exports (primitives, contracts, constants) from a single barrel (`src/Core/Kernel/index.ts`)
**Plans**: 2 plans

**Wave 1 *(Primitives)***
- [x] 01-01-PLAN.md — Primitives: enums (Severity, LayerType), branded types (CorrelationId, ErrorCode, OperationId), and initial barrel

**Wave 2 *(blocked on Wave 1 completion) — Contracts + Constants***
- [x] 01-02-PLAN.md — Contracts (ErrorBase, ResultBase, Validators), constants (ErrorCodes, LayerNames), and complete barrel API surface

**Cross-cutting constraints:**
- All plans must execute `npx tsc --noEmit` for verification
- Zero external dependencies enforced throughout
- `tsconfig.json` target must be ES2022+
- All exports must route through `src/Core/Kernel/index.ts` barrel

### Phase 2: Foundations Base Layer
**Goal**: Developers have reusable abstract base classes that implement Kernel contracts with concrete monadic behavior, `toJSON()` serialization, and runtime type guards
**Mode**: v2
**Depends on**: Phase 1
**Requirements**: BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06
**Success Criteria** (what must be TRUE):
   1. Developer can extend `ErrorBase` abstract class and get automatic `toJSON()`, `isRecoverable()`, and `getSeverity()` implementations with cause-chain circularity detection
   2. Developer can create `Success<T>` and `Failure<T, E>` result instances using `ok()` and `err()` constructors, and chain monadic operations: `.map()`, `.flatMap()`, `.match()`, `.fold()`, `.tap()`, `.tapError()`
   3. Base error and result validators verify contract compliance at runtime for any subclass implementing the Kernel contracts
   4. Base error and result type guards (`isBaseError`, `isBaseResult`) discriminate base types at runtime
**Plans**: 4 plans

**Wave 1 *(Abstract classes — zero dependency within phase)***
- [x] 02-01-PLAN.md — Abstract base classes: ErrorBase (toJSON circularity-safe), ResultBase + Success/Failure + ok/err monadic, Abstracts barrel

**Wave 2 *(parallel — depends on Wave 1 for abstract class types)***
- [x] 02-02-PLAN.md — Duck-typing validators (BaseErrorValidator, BaseResultValidator) and type guards (isBaseError, isBaseResult)
- [x] 02-03-PLAN.md — Safe factory functions in Factories/: ValidationError interface, createCorrelationIdSafe, createErrorCodeSafe, createOperationIdSafe

**Wave 3 *(barrel chain — depends on all prior waves)***
- [ ] 02-04-PLAN.md — Barrel chain: Base/index.ts → Foundations/index.ts re-export all subdirectories

**Cross-cutting constraints:**
- All plans must execute `npx tsc --noEmit` for verification
- Zero external dependencies enforced
- Base layer depends on Kernel only — no other layer imports

### Phase 3: Domain Layer
**Goal**: Developers can create domain-specific errors and results that carry business rule semantics, fully isolated from framework concerns
**Mode**: v2
**Depends on**: Phase 2
**Requirements**: DOMN-01, DOMN-02, DOMN-03
**Success Criteria** (what must be TRUE):
  1. Developer can create `DomainError` subclasses (e.g., `UserNotFoundError`, `ComplaintNotFoundError`) that include domain context and are traceable to the Domain layer via `LayerType`
  2. Developer can use `DomainResult<T>` to represent business operation outcomes with success/failure states via `.match()`/`.fold()` on returned results
  3. Domain type guards (`isDomainError`) discriminate domain errors from other layer errors at runtime
  4. Domain layer imports from Kernel and Base only — no Application, Infrastructure, or Presentation imports exist
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

### Phase 4: Application Layer
**Goal**: Developers have use case orchestration with observability hooks and a Domain-to-Application error mapper that preserves the full cause chain
**Mode**: v2
**Depends on**: Phase 3
**Requirements**: APP-01, APP-02, APP-03
**Success Criteria** (what must be TRUE):
  1. Developer can create `ApplicationError` instances from `DomainError` via the domain-to-application mapper, preserving the cause chain and adding correlation context
  2. Developer can use `ApplicationResult<T>` with observability hooks that log each operation result (`tap`/`tapError`) and emit metrics
  3. Correlation IDs propagate automatically through Application-level error chains and are accessible in logs
  4. Application layer uses constructor injection (no direct DB or external service calls in Use Cases)
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

### Phase 5: Infrastructure Layer
**Goal**: Developers have resilient I/O error handling with sanitization, retry, timeout, circuit breaker, and fallback — safely wrapping external concerns
**Mode**: v2
**Depends on**: Phase 4
**Requirements**: INFO-01, INFO-02, INFO-03
**Success Criteria** (what must be TRUE):
  1. Developer can wrap external service calls with `InfrastructureResult` and apply `retry()` with configurable backoff, `withTimeout()`, `withCircuitBreaker()`, and `withFallback()` behavior
  2. Infrastructure errors sanitize sensitive information (hostnames, connection strings, stack traces) before wrapping upward to Application layer
  3. Application-to-Infrastructure error mapper preserves error semantics without leaking infrastructure internals
  4. Infrastructure depends on Application/Domain (not vice versa) — no upward dependency violations
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

### Phase 6: Presentation Layer
**Goal**: Server Actions can safely return serializable error/results to client components — no OOP classes cross the RSC boundary
**Mode**: v2
**Depends on**: Phase 4
**Requirements**: PRES-01, PRES-02, PRES-03
**Success Criteria** (what must be TRUE):
  1. `PresentationError` discriminated union has exactly 5 variants (`ValidationError`, `NotFoundError`, `AuthorizationError`, `SystemError`, `NetworkError`) with only safe-for-client fields (no `cause`, no `stack`)
  2. `PresentationResult<T>` is a plain object discriminated union with `_tag` discriminant that survives JSON serialization/deserialization
  3. Application-to-Presentation error mapper converts any `ApplicationError` to the correct `PresentationError` variant, stripping internal details
  4. Client component can exhaustively match on `PresentationError._tag` in a switch statement with TypeScript narrowing
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

### Phase 7: Tooling & Boundary Enforcement
**Goal**: Layer isolation is enforced by automated tooling, and all architectural invariants are validated in CI before any code reaches production
**Mode**: v2
**Depends on**: Phase 1
**Requirements**: (Infrastructure/tooling — supports all phases)
**Success Criteria** (what must be TRUE):
  1. `dependency-cruiser` detects and blocks any import from Domain to Infrastructure (or other layer violations) as a CI-blocking failure
  2. ESLint `import/no-restricted-paths` prevents cross-layer imports during local development with clear error messages
  3. `madge` circular dependency detection runs as a pre-commit hook and in CI
  4. Serialization safety tests verify that no OOP class (no prototype methods) can accidentally cross the Presentation boundary in a Server Action
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

### Phase 8: Module Integration & Server Actions
**Goal**: The complete 5-layer error/result system works end-to-end in real Next.js Server Actions and client components, validating the architecture holistically
**Mode**: v2
**Depends on**: Phase 6, Phase 7
**Requirements**: (Integration — validates all prior layers)
**Success Criteria** (what must be TRUE):
  1. A Server Action can execute a business operation, propagate errors through all layers (Domain → Application → Infrastructure → Application → Presentation), and return a safe `PresentationResult<T>` to the client
  2. A client component can render different UI states based on `PresentationResult` match (success, validation error, not found, authorization error, system error)
  3. Error boundaries in the React tree catch unhandled errors and log them with full cause-chain context
  4. Middleware hooks propagate correlation IDs across the request lifecycle
**Plans**: TBD

Plans:
- (Plans defined during gsd-plan-phase)

## Progress

**Execution Order:** Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Kernel Layer | 2/2 | ✓ Complete | 2026-06-08 |
| 2. Foundations Base Layer | 3/4 | ◆ Wave 2 Complete | - |
| 3. Domain Layer | 0/0 | Not started | - |
| 4. Application Layer | 0/0 | Not started | - |
| 5. Infrastructure Layer | 0/0 | Not started | - |
| 6. Presentation Layer | 0/0 | Not started | - |
| 7. Tooling & Boundary Enforcement | 0/0 | Not started | - |
| 8. Module Integration & Server Actions | 0/0 | Not started | - |
