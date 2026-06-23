# Phase 8: Module Integration & Server Actions — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 08-module-integration-server-actions
**Areas discussed:** DI Library, Composition Root Structure, Container Token & Lifetime Strategy, Pending Plans Alignment

---

## DI Library: Lightweight Container vs InversifyJS

| Option | Description | Selected |
|--------|-------------|----------|
| Keep lightweight Container | Current ~40-line custom class. Zero deps, explicit binding, full control. | |
| Switch to InversifyJS | Install inversify. Decorator-based injection, auto-resolution, request-scoped lifetimes. | ✓ |

**User's choice:** Switch to InversifyJS

**Follow-up questions:**

| Question | Option | Selected |
|----------|--------|----------|
| How should InversifyJS integrate with Hybrid 4+6? | Module-owned ContainerModules | ✓ |
| (alternative) | Centralized container config | |
| Token type for InversifyJS bindings? | Symbol-based (current style) | ✓ |
| (alternative) | Class-based identifiers | |
| (alternative) | String-based identifiers | |
| Default lifetime? | Transient default (current) | ✓ |
| (alternative) | Singleton default | |

**Notes:**
- "Module-owned ContainerModules is the gold standard for large projects because it achieves scalability and maintainability, while centralized is just a temporary solution for small projects (Proof of Concept) and not for enterprise scaling."
- "Symbol-based identifiers, specifically Symbol.for('ModuleName.InterfaceName') as a unified standard. This is the only option that complies with Hybrid 4+6 requirements. We reject Class-based because it doesn't work with interfaces (erased at runtime), and reject String-based because it lacks safe namespace isolation, especially with multiple teams working on different bounded contexts."
- "Transient as default behavior (current behavior), with the rule of Explicit over Implicit. Singleton will only be marked on static infrastructure services (DB connectors, Redis clients, general logging) that require state sharing for purely performance reasons. Changing the default to Singleton at this stage is an unjustified risk equivalent to 'Premature Optimization' that could cost us silent production bugs."

---

## Composition Root Structure Lock

| Option | Description | Selected |
|--------|-------------|----------|
| Lock as designed | Confirm: CompositionRoot/index.ts creates container, loads ContainerModules from each module. | ✓ |
| Need adjustments | The pattern needs changes from what's currently implemented. | |

**Follow-up questions:**

| Question | Option | Selected |
|----------|--------|----------|
| File layout? | Separate config vs orchestration | ✓ |
| (alternative) | Same file does both | |
| Cleanup old dirs? | Remove Bindings/ and Containers/ | ✓ |
| (alternative) | Keep as reference | |

**Notes:**
- Hybrid 4+6 structure confirmed as designed in commit 19a7f4d
- container.ts handles InversifyJS setup (config); index.ts handles loading modules (orchestration)
- Old Bindings/ and Containers/ directories to be removed

---

## Container Token & Lifetime Strategy

| Question | Option | Selected |
|----------|--------|----------|
| Token naming convention? | Symbol.for('Module.Interface') (current) | ✓ |
| (alternative) | Symbol.for('Interface') only | |
| Where do ContainerModules get created? | In registration.ts alongside bind() calls | ✓ |
| (alternative) | New container-module.ts file | |
| Request-scoped lifetime? | Not needed yet — defer | ✓ |
| (alternative) | Set up infrastructure now | |

**Notes:**
- Token naming: Symbol.for('Module.Interface') continues as standard
- ContainerModule created in registration.ts where bind() calls already live — familiar location
- Request scoping deferred — no concrete use case yet

---

## Pending Plans Alignment

| Question | Option | Selected |
|----------|--------|----------|
| How to update plans? | Rewrite plans 08-04 through 08-09 | ✓ |
| (alternative) | Create new plans (08-10 onward) | |
| (alternative) | Update on-the-fly during execution | |
| Migration approach? | Standalone migration plan | ✓ |
| (alternative) | Migration task in 08-04 | |
| Install timing? | Install during plan execution | ✓ |
| (alternative) | Install now | |

**Notes:**
- 08-04 becomes standalone "Migrate to InversifyJS + cleanup" plan: replace custom Container, convert to ContainerModules, remove old directories
- 08-05 through 08-09 rewritten with updated files_modified and task actions for Hybrid 4+6 + InversifyJS
- No plans to execute before InversifyJS migration

---

## the agent's Discretion

- Exact file naming for action files
- AsyncLocalStorage context implementation details — already implemented
- @tanstack/react-form configuration and field mapping
- Toast notification styling and positioning
- Error boundary recovery UI design
- Loading/skeleton states for auth pages
- Error code format for module-specific errors
- Drizzle query structure in repository implementations

## Deferred Ideas

- Request-scoped DI lifetimes — not needed for Phase 8
