# Layered Error & Result System

## What This Is

A multi-layered Error and Result system for a Next.js 16 + Better Auth application that provides typed contracts, primitives, and constants as the foundational backbone for error handling and result propagation across all architectural layers (Domain, Application, Infrastructure, Presentation). Based on a Hybrid Architecture combining OOP for inner layers and Discriminated Unions at the serialization boundary.

## Core Value

Every error in the system is typed, traceable to its origin layer, and safely serializable — no untyped exceptions, no information leaks, no "cannot read properties of undefined" in production.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Better Auth authentication schema (User, Session, Account, Verification tables) — existing
- ✓ Drizzle ORM + PostgreSQL connection pool with singleton client — existing
- ✓ shadcn/ui component system with 50+ UI components — existing
- ✓ Layered folder structure (Core/Kernel, Core/Foundations scaffolded) — existing
- ✓ Composition Root scaffolded — existing
- ✓ Project tooling: Biome, TypeScript strict, pnpm — existing
- ✓ Kernel directory scaffolded (Contracts, Primitives, Constants subfolders) — existing
- ✓ Foundations directory scaffolded (Base, Domain, Application, Infrastructure, Presentation subfolders) — existing

### Active

<!-- Current scope. Building toward these. -->

**Phase 1 — Kernel Layer**

- [ ] **KRNL-01**: Primitive enums defined (Severity, LayerType)
- [ ] **KRNL-02**: Primitive branded types defined (CorrelationId, ErrorCode, OperationId)
- [ ] **KRNL-03**: Base contracts defined (ErrorBase contract, ResultBase contract)
- [ ] **KRNL-04**: Validator contracts defined (LayerValidator, ErrorValidator, ResultValidator)
- [ ] **KRNL-05**: Constants defined (Error codes, Layer names)
- [ ] **KRNL-06**: Public API barrel exports from Kernel index

### Out of Scope

- Foundations layer implementations (Base abstracts, Domain, Application, Infrastructure, Presentation) — deferred to later phases
- Module-specific error types (complaint, user, order errors) — deferred
- Cross-layer mappers — deferred
- Tests — deferred
- Authentication UI (sign-in/sign-up pages) — deferred

## Context

- The project already has a Next.js 16 + Better Auth authentication scaffold with Drizzle ORM, shadcn/ui, and a complete folder structure for the Hybrid Architecture (Clean Architecture + DDD + CQRS).
- The architecture docs (`docs/Architecture.md`) and base system docs (`docs/Base_System.md`) provide detailed specifications for a multi-layered Error/Result system.
- The `src/Core/Kernel/` and `src/Core/Foundations/` directories are already scaffolded with empty files.
- The first implementation step is the Kernel layer — the framework-agnostic primitives, contracts, and constants that all other layers depend on.
- No existing tests, no CI pipeline, no linting configured beyond Biome defaults.

## Constraints

- **Tech stack**: TypeScript (strict), zero external dependencies for Kernel layer
- **Architecture**: Hybrid OOP (inner layers) + Discriminated Unions (Presentation)
- **Serialization boundary**: Any object crossing Server Action → Client must be a plain object
- **Import boundaries**: Kernel must depend on nothing (zero imports from other layers)
- **Naming**: Follow documented file conventions (`*.contract.ts`, `*.enum.ts`, `*.type.ts`, `*.constants.ts`)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Kernel layer first | Foundations and Modules depend on Kernel primitives; must build bottom-up | — Pending |
| Branded types for primitives | Type-safe IDs prevent mixing CorrelationId, ErrorCode, OperationId at compile time | — Pending |
| OOP for inner layers | Polymorphism, Dependency Injection, encapsulation per Architecture.md | — Pending |
| DU for Presentation | Safe RSC serialization across network boundary per Architecture.md | — Pending |
| Rely on documented specifications | Base_System.md + Architecture.md provide complete specs for implementation | — Pending |
| Skip tests for Phase 1 | User explicitly deferred testing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-07 after initialization*
