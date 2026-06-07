# Feature Landscape: Layered Error & Result System

**Domain:** Multi-layered Error/Result architecture for TypeScript (Next.js 16)
**Researched:** 2026-06-07
**Mode:** Ecosystem — Production-grade Error/Result systems in TypeScript
**Overall confidence:** HIGH (verified against neverthrow, Effect, ts-safe-result, better-result, verdict-ts, and production post-mortems)

---

## Table Stakes

Features that any production-grade Error/Result system must have. Missing these = system is unsafe, unobservable, or unmaintainable.

| # | Feature | Why Expected | Rationale / Evidence | Complexity |
|---|---------|--------------|----------------------|------------|
| 1 | **Branded type safety for primitives** | Prevents `CorrelationId`/`ErrorCode`/`OperationId` mix-ups at compile time | TypeScript's structural typing treats all `string`s as equal — branded types (`T & { readonly __brand: B }`) create nominal distinctions with zero runtime cost. This is the industry standard for production ID safety. [Source: Learning TypeScript, Application Architect 2026, DEV branded types guide] | Low |
| 2 | **Layer type enums** (`Severity`, `LayerType`) | Every error must be traceable to its origin layer for observability and routing | All production layered systems (Effect, @kitiumai/error, roastery-cms/terroir) use layer symbols/enums. Severity (`critical|error|warning|info`) drives alert routing. Without these, you can't filter "infra" vs "domain" errors in monitoring. [Source: roastery-cms/terroir uses `ExceptionLayer` symbol, @kitiumai/error uses `ErrorSeverity` enum] | Low |
| 3 | **Monadic operations** (`map`, `flatMap`, `match`, `fold`, `tap`, `tapError`) | Essential for composable error handling without nesting | Every Result library in the TS ecosystem provides these: neverthrow (`Ok.map().andThen()`), Effect (`Effect.map().pipe()`), ts-safe-result, better-result, verdict-ts. Without these, callers resort to manual `if` chains that are verbose and error-prone. `match`/`fold` enforce exhaustive handling at compile time. [Source: neverthrow docs, Effect docs, PkgPulse 2026 comparison] | Low |
| 4 | **Error cause chaining** (`cause: ErrorBase | undefined`) | Preserves full error context through wrapping layers | Required by spec (Base_System.md §2.1). Matches JavaScript native `Error.cause` (ES2022). Without it, wrapped errors lose diagnostic information. @kitiumai/error and Effect both support cause chains. [Source: Base_System.md, ES2022 spec, @kitiumai/error `cause` field] | Low |
| 5 | **Serializable error codes** (`toJSON(): object`) | Server Action → Client serialization boundary (RSC) | Next.js RSC serializer only passes plain objects — class instances lose methods and prototype. Every Result library that crosses boundaries must be serializable. verdict-ts (491B) uses plain objects specifically to solve this. `toJSON` is the standard serialization contract. [Source: Jsonic.io RSC serialization guide, CapsuleRSC, verdict-ts README] | Low |
| 6 | **Discriminated Union at Presentation boundary** (`_tag` field) | RSC-safe serialization that survives `structuredClone` | Next.js Server Actions must return plain objects. Discriminated Unions are the only pattern that: (a) serializes to JSON safely, (b) enables TypeScript narrowing on the client, (c) enforces exhaustive match handling. Next.js docs explicitly recommend DU return types for Server Actions. [Source: Next.js error handling docs 2026, Architecture.md §5, Jsonic "What crosses boundary" table] | Medium |
| 7 | **Layer-specific type guards** (`isDomainError`, `isApplicationError`) | Runtime narrowing when types can't prove at compile time | Every layer has dedicated type guards for narrowing in catch-all handlers and error boundaries. Without these, middleware can't distinguish "expected business error" from "infrastructure crash" for proper routing. [Source: Base_System.md §5.2, BSWEN layered error handling guide 2026, roastery-cms/terroir `ExceptionLayer` symbol] | Low |
| 8 | **Exhaustive match enforcement** via `match`/`fold` | Prevents silent failure when error variants are added | The compiler ensures all branches are handled. `never`-exhaustive checks on `match` callbacks catch new error variants at build time, not in production. This is the primary value proposition over `try/catch`. [Source: "Stop Writing try/catch" — Maryan Mats 2026, "Error Handling in Production" — Let's Build Solutions 2026] | Low |

### Table Stakes Dependencies

```
Branded types (1) ─── supports ───→ ErrorCode branded type (for error codes constant)
LayerType enum (2) ─── required by ───→ ErrorBase contract (4)
Severity enum (2) ─── required by ───→ ErrorBase contract (4)
Monadic ops (3) ─── compose on ───→ ResultBase contract
Cause chaining (4) ─── required by ───→ Cross-layer transformation (see Differentiators)
toJSON (5) ─── required by ───→ Presentation DU (6) serialization
Type guards (7) ─── guard ───→ Each layer's error/result class
```

---

## Differentiators

Features that elevate the system from "functional Result library" to "enterprise-grade observability and resilience platform." Not table stakes, but justified by the project's value proposition: "Every error in the system is typed, traceable, and safely serializable."

| # | Feature | Value Proposition | Complexity | Evidence |
|---|---------|-------------------|------------|----------|
| 1 | **Explicit cross-layer mapper contracts** (`DomainToApplicationMapper`, `ApplicationToPresentationMapper`) | Layer isolation is the architecture's core promise. Explicit mappers at boundaries prevent leaky abstractions — the #1 pitfall in layered systems. Each layer owns its error vocabulary and maps errors from below (one layer deep only). [Source: "Multi-level Error Handling with Monads" — Fuma dev portal, PkgPulse "Neverthrow vs Effect" 2026] | Medium | Industry standard: Effect's `Effect.mapError`, sweet-decorators `@MapErrors`, @kitiumai/error's `ErrorRegistry` |
| 2 | **Observability hooks** via `tap`/`tapError` (`log()`, `metrics()`, `trackExecution()`) | Structured logging at the `Result` level enables per-operation metrics without scattering `console.log` across codebase. neverthrow's `tap`/`tapError` is the pattern. [Source: neverthrow docs, @kitiumai/error Observability Integration, Base_System.md §6] | Low | Add via `ApplicationResult.tap(r => logger.info(...))`. No additional dependencies needed for basic case. |
| 3 | **Audit trail** on ApplicationResult (`audit()`) | Required for compliance — every sensitive operation (create order, auth, payment) must be logged before transformation to PresentationResult. Base_System.md §6.5 specifies this. [Source: Base_System.md §6.5, "Error Handling in Production" — Let's Build Solutions 2026 auditable error codes] | Medium | Must capture userId, operationName, timestamp before crossing to Presentation layer |
| 4 | **Distributed tracing support** (`correlationId`, `operationId`, `parentSpanId`) | correlationId propagates through all layers. operationId is unique per operation. Required for correlating errors in distributed systems. [Source: Base_System.md §6.3, @kitiumai/error tracing integration, universal-error-handler's `traceId` pattern] | Medium | Infrastructure: OpenTelemetry span enrichment on InfrastructureResult |
| 5 | **InfrastructureResult resilience** (`retry()`, `withTimeout()`, `withCircuitBreaker()`, `withFallback()`) | Infrastructure errors are transient. Built-in retry (with backoff), timeout, circuit breaker, and fallback prevent cascading failures. Effect provides this natively; most libraries don't. [Source: Base_System.md §3.2, Effect v4 retry/timeout/circuit breaker, "TypeScript Microservices: Limit Blast Radius" 2026, BSWEN `isRetryable` flag] | High | Requires careful design: retry semantics, idempotency keys, circuit state management |
| 6 | **Combination combinators** (`combine` preserving tuple types) | Validate multiple results in parallel while preserving individual types. e.g., `combine([validateEmail(email), validateAge(age)])` returns `Result<[string, number], E>`. Critical for bulk validation — most libraries lose tuple types here. [Source: verdict-ts tuple inference, Effect `Effect.all`, neverthrow `combineWithAllErrors`] | Medium | TypeScript tuple inference requires mapped types over rest parameters |
| 7 | **Generator-based safe composition** (`Result.gen()`) | Write Result pipelines with `yield*` that read like normal `async/await` but work synchronously. better-result and ts-safe-result pioneered this. Solves the "callback hell" problem in Result chains. [Source: better-result `Result.gen()`, znck.dev "Designing a result type" 2025, kanzaki.result `Symbol.iterator`] | Medium | Requires `@typescript` use of generators (ES2015 target). Optional — method chaining works as fallback |
| 8 | **PII automatic redaction** in Presentation | Infrastructure errors carry sensitive details (DB hostnames, stack traces). Presentation layer must strip these. `InfrastructureError.sanitizeForPresentation()` is the hook. [Source: @kitiumai/error PII redaction, Base_System.md §4.3 "Error Sanitization", BSWEN "Service temporarily unavailable" pattern] | Low | Implement as `toJSON()` that filters sensitive fields. No dependency needed |
| 9 | **Error registry / central error codes** | Single source of truth for error codes with format validation, documentation URLs, and lifecycle management. @kitiumai/error provides this as a differentiating feature. [Source: @kitiumai/error `ErrorRegistry` with `register()` / `resolve()`, "Structured error codes" — petrtcoi 2026] | Medium | Deferred to later phases (Base_System.md references error codes in Foundation layers) |
| 10 | **i18n-ready user messages** | Error codes map to localized user messages. The `code` is stable; `userMessage` is locale-dependent. universal-error-handler's `UIMessageMapper` does this. [Source: @kitiumai/error i18n support, universal-error-handler's `UIMessageMapper`, universal-error-handler ErrorCode enum] | Medium | Requires a message map per locale. Best done at Presentation layer only |

### Differentiators Roadmap Fit

| Phase | Differentiators to Include | Rationale |
|-------|---------------------------|-----------|
| **Phase 1 (Kernel)** | None — all table stakes only | Kernel can have zero external dependencies |
| **Phase 2 (Foundations Base)** | (6) Combination combinators, (7) Generator composition | These are on ResultBase and require no external infra |
| **Phase 3 (Domain + Application)** | (1) Cross-layer mappers, (2) Observability hooks via tap, (3) Audit trail | mappers/ and observability live here |
| **Phase 4 (Infrastructure)** | (4) Distributed tracing, (5) Retry/circuit-breaker/fallback | Requires Resilience infrastructure contracts |
| **Phase 5 (Presentation)** | (8) PII redaction, (9) Error registry, (10) i18n messages | Final layer, closest to UI |

---

## Anti-Features

Things to explicitly NOT build in this system. Each is a known pitfall from production post-mortems and ecosystem analysis.

| # | Anti-Feature | Why Avoid | Instead Do This | Source |
|---|-------------|-----------|-----------------|--------|
| 1 | **Implicit type coercion between layers** (auto-converting DomainError → ApplicationError without explicit mapper) | Breaks layer isolation. If you can silently pass a DomainError through Application code, the Application layer loses its ability to add operation context, user context, and correlationId. Violates Base_System.md "Explicit Transformation" principle. | Always use explicit mapper classes/transform functions at boundaries. The compiler should enforce that `ApplicationError` cannot be constructed from a `DomainError` without going through `DomainToApplicationErrorMapper`. | Base_System.md §2, Architecture.md §5, "Multi-level Error Handling with Monads" boundary mapping rule |
| 2 | **Mixing Discriminated Unions and OOP in the same layer** (DU members with methods, or OOP classes used at serialization boundary) | Causes `structuredClone`/`postMessage` failures at runtime. Class instances crossing RSC boundary lose methods silently — TypeScript doesn't warn. DU with methods defeats the purpose of DU (plain data). | OOP inside (Domain, Application, Infrastructure). DU only at Presentation (serialization boundary). The golden rule from Architecture.md: "OOP for behavior and complex logic. DU for transport, boundaries, and interfaces." | Architecture.md §2, CapsuleRSC 3-layer defense, Jsonic.io "Class instances lose methods", verdict-ts README |
| 3 | **Exposing internal error types at boundaries** (`DomainError` or `ApplicationError` in Server Action return type) | Breaks encapsulation and leaks sensitive info (business rules, stack traces). Server Actions must return only `PresentationResult<T>` per Base_System.md rule R1. | Map to `PresentationError` DU at the Server Action boundary. Use `ApplicationToPresentationErrorMapper`. The mapper contract guarantees this by design. | Base_System.md §8 rule 1, Architecture.md §6 rule 1, universal-error-handler architecture diagram |
| 4 | **Runtime type checks instead of compile-time safety** (`instanceof` checks for error type discrimination in business logic) | `instanceof` fails across realm boundaries (iframes, Workers, Node.js VM modules). TypeScript's structural typing with discriminated unions is more reliable and has zero runtime cost. | Use `_tag`/`_kind` discriminated unions or layer type guards. Prefer compile-time narrowing over runtime `instanceof`. | "Stop Writing try/catch" — Maryan Mats (instanceof pitfalls across realms), ES2026 `Error.isError()` TC39 proposal |
| 5 | **Zod.parse() for internal data that's already typed** (re-validating data within your own layer after the boundary parse) | Wastes CPU and bundle size. Silently coerces type mismatches (e.g., `z.coerce.number()` covers up upstream bugs). The rule: parse at trust boundaries only (API edge, form input, webhook). Internal calls between your own compiled modules don't need another parse. | One schema per ingress boundary. Export `z.infer` types downstream. Internal functions trust the types that already survived the boundary parse. Reserve `parse()` for edges, `safeParse()` for forms/APIs. | "Stop using Zod for internal-only API contracts" — TypeScript World 2026 |
| 6 | **Class-based Result types across serialization boundaries** (neverthrow-style `Ok`/`Err` classes used as Server Action return) | Classes lose methods on `structuredClone`. `JSON.stringify(result)` produces `{}` for methods. `postMessage()` strips prototypes. For RSC boundaries, this is a runtime error (classes in props). | Presentation layer must use plain objects (DU). Layer-appropriate: OOP for inner layers, DU for boundaries. For Results that never cross boundaries, classes are fine. | verdict-ts differentiation (491B plain objects), Next.js RSC serialization rules, Jsonic.io serialization table |
| 7 | **Swallowing errors without cause chain** (catching and returning a new error without preserving original cause) | Destroys debugging ability. The original db/network error is lost. The new error says "operation failed" with no indication of why. | Always pass `cause: originalError` when wrapping. ErrorBase already has `cause?: ErrorBase` in the contract. Make it mandatory in mapper implementations. | Base_System.md §4.3 "Error Wrapping", JavaScript `Error.cause`, Effect `Effect.mapError` |
| 8 | **Using `throw` for expected domain errors** (throwing `UserNotFoundError` instead of returning `Result.Err`) | `throw` creates invisible control flow. The function signature doesn't encode failure modes. Callers must inspect implementation to know what can go wrong. Returns are honest; throws are hidden GOTO. | Return domain failures as `DomainResult.Err`. Only `throw` for: programming errors (invalid args, invariant violations), framework boundaries (Express/Next.js error middleware), and unrecoverable states. | "Avoid throwing for expected failures" — Christian Rackerseder 2026, "Stop Writing try/catch" — Maryan Mats 2026, Eric Lippert's exception classification |
| 9 | **Enforcing Result types on every function** (100% Result coverage for pure computations) | Creates friction without value. Functions that format strings, compute sums, or transform dates don't need Result — they always succeed. Over-adoption leads to team fatigue and reduced ROI. | Use Result at architectural boundaries: DB calls, API requests, external services, domain decisions, DTO mapping. Leave pure computations as simple returns. Document which boundaries require Result. | "Fixing TypeScript's Error Handling" — Ethan Resnick (ROI analysis), "Stop Guessing What a Function Returned" — petrtcoi 2026 (boundary-based approach), PkgPulse pragmatic neverthrow advice |
| 10 | **Combining `null`/`undefined` returns with `Result`** (simultaneously using `return null` and `return Result.Err` for failures) | Doubles the failure model. Now callers must check both `null` and `Result.isErr()`. Increases cognitive load. The `Option`/`Maybe` pattern is a separate concern. | Consistent failure model: use `Result.Err` for failures, never `null`. If you need "absence without error", use an explicit `NotFound` variant in the error type or use a separate `Option<T>` type. | "Stop Guessing What a Function Returned" — petrtcoi, "Designing a result type" — znck.dev (absence vs failure distinction) |

### Anti-Feature Enforcement Strategy

| Anti-Feature | Enforcement Layer | Mechanism |
|--------------|-------------------|-----------|
| (1) Implicit coercion | Application + Infrastructure | Mapper contracts require explicit calls; no `as` casting at boundaries |
| (2) Mixing OOP/DU | Presentation | ESLint rule: no `new ClassName` in Presentation files |
| (3) Exposing internal types | Presentation + Server Actions | Server Action return type must be `PresentationResult<T>`; enforce via barrel exports |
| (4) Runtime instanceof | Code Review + Tests | Prefer `_tag` narrowing; add tests verifying cross-realm `isError` safety |
| (5) Over-validation | Code Review | Document trust boundaries; only Zod-parse at APi/form/edge boundaries |
| (6) Class across boundary | Build (TypeScript) | Presentation layer cannot import from `foundations/base/abstracts/` |
| (7) Swallowed causes | Tests | Integration tests must verify cause chains survive wrapping |
| (8) Throw for expected errors | ESLint rule | Ban `throw` in Domain/Application service files (allow only in infrastructure wrappers) |
| (9) Over-adoption | Team convention | "Boundaries only" guideline in project README |
| (10) Mixed failure model | TypeScript strict | `noUncheckedIndexedAccess` + ban on bare `return null` in Result-returning functions |

---

## Feature Dependencies

```
Phase 1 (Kernel)          Phase 2 (Foundations Base)     Phase 3 (Application)          Phase 4 (Infrastructure)      Phase 5 (Presentation)
──────────────────────    ──────────────────────────     ───────────────────────         ──────────────────────────     ─────────────────────────
Branded types ──────→    ErrorBase abstract ────────→    DomainError/Result              InfrastructureError          PresentationError (DU)
LayerType/Severity ──→   ResultBase abstract ───────→   ApplicationError/Result         InfrastructureResult          PresentationResult (DU)
ErrorCode branded ───→   type guards                  Application-to-Presentation      Retry/circuit-breaker         PII redaction
CorrelationId branded─→   combination combinators         mappers                          Tracing integration           i18n mapping
OperationId branded                                        Audit trail                      Timeout/fallback               Error registry
Contract interfaces                                      Observability hooks                                             
                                                         Generator composition
```

Phases flow bottom-up by dependency: Kernel has no imports → Base abstracts Kernel → Domain/App/Infra extend Base → Presentation transforms all.

---

## Complexity Assessment

| Feature Category | Complexity | Count | Notes |
|-----------------|-----------|-------|-------|
| **Table Stakes** | Low | 7 of 8 | Only Presentation DU is Medium due to exhaustive type design |
| **Table Stakes** | Medium | 1 of 8 | Presentation DU |
| **Differentiators** | Low | 3 of 10 | Observability hooks (tap/tapError), PII redaction, i18n |
| **Differentiators** | Medium | 5 of 10 | Cross-layer mappers, Audit trail, Combination, Generator composition, Error registry |
| **Differentiators** | High | 2 of 10 | Distributed tracing (needs OpenTelemetry), Retry/circuit-breaker (needs state machine) |
| **Anti-Features** | N/A | 10 | These are "don't build" items — enforcement cost only |

---

## Phase Mapping for MVP

### Phase 1 (Kernel) — Table Stakes Only
1. Branded types (CorrelationId, ErrorCode, OperationId)
2. LayerType enum, Severity enum
3. ErrorBase contract interface (with `cause: ErrorBase | undefined`)
4. ResultBase contract interface (with map/flatMap/match/fold/tap)
5. ErrorCode constants
6. LayerName constants

### Phase 2 (Foundations Base) — Table Stakes + Low Differentiators
1. ErrorBase abstract class (with toJSON, isRecoverable)
2. ResultBase abstract class (with monadic implementations)
3. Type guards (base-error.type-guard, base-result.type-guard)
4. Validators (base-error.validator, base-result.validator)
5. **Differentiator**: Combination combinators (preserving tuple types)
6. **Differentiator**: Generator-based composition on ResultBase

### Phase 3 (Domain + Application) — Medium Differentiators
1. DomainError + DomainResult (OOP classes extending Base)
2. ApplicationError + ApplicationResult (OOP classes extending Base)
3. **Differentiator**: DomainToApplication mapper
4. **Differentiator**: Application-level observability hooks (log/metrics via tap)
5. **Differentiator**: Audit trail on ApplicationResult (audit())
6. **Differentiator**: Generator composition on ApplicationResult

### Phase 4 (Infrastructure) — High Differentiators
1. InfrastructureError + InfrastructureResult (OOP classes extending Base)
2. **Differentiator**: Retry with backoff on InfrastructureResult
3. **Differentiator**: Timeout support on InfrastructureResult
4. **Differentiator**: Circuit breaker support on InfrastructureResult
5. **Differentiator**: Fallback value support on InfrastructureResult
6. **Differentiator**: Distributed tracing (OpenTelemetry integration)

### Phase 5 (Presentation) — Final Layer
1. PresentationError (Discriminated Union) + PresentationResult (DU)
2. **Differentiator**: ApplicationToPresentation mapper
3. **Differentiator**: PII redaction in toJSON
4. **Differentiator**: i18n-ready user messages
5. **Differentiator**: Error registry for centralized error code management

---

## Sources

### Verified (HIGH confidence)
- **Base_System.md** — Project specification for layered Error/Result system
- **Architecture.md** — Hybrid OOP + DU architecture specification
- **neverthrow docs** — https://github.com/supermacro/neverthrow (Result type, ResultAsync, combine)
- **Effect docs** — https://effect.website/docs (Effect system, retry, DI, observability)
- **better-result docs** — https://better-result.dev (Generator composition, serialize/deserialize)
- **verdict-ts** — https://github.com/flyingsquirrel0419/verdict-ts (Plain object Result, tuple inference, 491B)
- **ts-safe-result** — https://github.com/maryanmats/ts-safe-result (AsyncResult, cross-realm isResult, match)
- **@kitiumai/error** — https://github.com/kitiumai/error (Error registry, PII redaction, i18n, OpenTelemetry)
- **RSC serialization rules** — https://jsonic.io/guides/json-in-react-server-components (What crosses RSC boundary)
- **Next.js error handling docs** — https://nextjs.org/docs/app/getting-started/error-handling (Error boundaries, error.tsx)

### Verified (MEDIUM confidence — web sources with supporting evidence)
- **PkgPulse "Neverthrow vs Effect vs oxide.ts 2026"** — https://www.pkgpulse.com/guides/neverthrow-vs-effect-ts-vs-oxide-ts-result-types-2026 (Feature comparison table, ~500K vs ~300K downloads)
- **"Multi-level Error Handling with Monads"** — Fuma dev portal (Boundary mapping rule: one layer deep only)
- **"Error Handling in Production"** — Let's Build Solutions 2026 (Result pattern, error codes, graceful degradation)
- **"Stop Writing try/catch"** — Maryan Mats 2026 (instanceof issues across realms, Eric Lippert classification)
- **"Avoid throwing for expected failures"** — Christian Rackerseder 2026 (Throw vs Return philosophy)
- **"TypeScript Branded Types: Stop Mixing Up IDs"** — DEV Community 2026 (Branded type pattern, zero-cost)
- **"Branded Types"** — Application Architect 2026 (unique symbol brands, constructor functions)
- **"Stop using Zod for internal-only API contracts"** — TypeScript World 2026 (Trust boundary rule, z.coerce hazard)
- **"Fixing TypeScript's Error Handling"** — Ethan Resnick (Result ROI analysis, over-adoption risks)
- **"TypeScript Microservices: Limit Blast Radius"** — typescript.page 2026 (Circuit breaker, idempotency, bulkheads)
- **"Designing a result type that feels native"** — znck.dev 2025 (Generator composition, Promise parallelism)
- **"Stop Guessing What a Function Returned"** — petrtcoi 2026 (Structured fault codes, boundary approach)
- **universal-error-handler** — https://github.com/shubhamgupta-oss/universal-error-handler (UIMessageMapper, ErrorNormalizer, request correlation)
- **CapsuleRSC** — https://github.com/yuuichieguchi/capsule-rsc (3-layer serialization defense: type/build/runtime)
- **BSWEN "Layered Error Handling"** — https://docs.bswen.com/blog/2026-03-04-nodejs-layered-error-handling/ (isRetryable flag, sanitization pattern)
- **rust-result/oxide.ts** — Rust-inspired Result patterns (match, unwrap, unwrapOr)

### Flags (LOW confidence — single source, not yet verified)
- Effect v4 bundle size reduction (20KB) — from PkgPulse, needs official verification
- TC39 Result/native error handling proposal status — from PkgPulse, likely still early stages
- Neverthrow maintenance slowdown — from multiple PkgPulse sources, library may be "done" not abandoned
