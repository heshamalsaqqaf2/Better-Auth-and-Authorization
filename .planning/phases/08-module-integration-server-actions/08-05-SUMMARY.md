---
phase: 08-module-integration-server-actions
plan: 05
subsystem: auth
tags: [inversifyjs, cqrs, usecases, auth, dto, mappers, ioc]

# Dependency graph
requires:
  - phase: 04
    provides: Application layer contracts (ICommandHandler, IQueryHandler, RequestContext, ApplicationResult)
  - phase: 05
    provides: Infrastructure layer contracts (mapInfrastructureToAppError, InfrastructureResult)
  - phase: 08-02
    provides: BetterAuthService wrapping Better Auth with InfrastructureResult
  - phase: 08-04
    provides: Domain aggregates (AuthenticatedUser, AuthSession), AUTH_TOKENS with UseCase symbols
provides:
  - SignInUseCase (ICommandHandler<SignInDTO, AuthResponseDTO>) — authenticates via BetterAuthService
  - SignUpUseCase (ICommandHandler<SignUpDTO, AuthResponseDTO>) — registers via BetterAuthService
  - SignOutUseCase (ICommandHandler<SignOutDTO, void>) — signs out via BetterAuthService
  - GetSessionQuery (IQueryHandler<SessionCheckDTO, SessionCheckDTO>) — retrieves session
  - DTO types (SignInDTO, SignUpDTO, SignOutDTO, AuthResponseDTO, UserDTO, SessionDTO, SessionCheckDTO)
  - Pure mapper functions (mapUserAggregateToDTO, mapSessionAggregateToDTO, mapAuthResultToResponse)
  - UseCase bindings in registration.ts ContainerModule
affects: [08-06, 08-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@injectable() + @inject(AUTH_TOKENS.XXX) decorator pattern for DI"
    - "UseCase delegates to BetterAuthService (no direct repo access)"
    - "Pure mapper functions (no classes/decorators)"

key-files:
  created:
    - src/Modules/Authentication/Application/DTOs/auth.dto.ts
    - src/Modules/Authentication/Application/DTOs/index.ts
    - src/Modules/Authentication/Application/Mappers/auth.mapper.ts
    - src/Modules/Authentication/Application/Mappers/index.ts
    - src/Modules/Authentication/Application/UseCases/Commands/sign-in.use-case.ts
    - src/Modules/Authentication/Application/UseCases/Commands/sign-up.use-case.ts
    - src/Modules/Authentication/Application/UseCases/Commands/sign-out.use-case.ts
    - src/Modules/Authentication/Application/UseCases/Queries/get-session.query.ts
    - src/Modules/Authentication/Application/UseCases/index.ts
  modified:
    - src/Modules/Authentication/Application/UseCases/Commands/index.ts
    - src/Modules/Authentication/Application/UseCases/Queries/index.ts
    - src/Modules/Authentication/Composition/registration.ts

key-decisions:
  - "SessionCheckDTO.headers made optional for dual input/output use (input has headers, output has user/session data)"
  - "UseCaseExecutionError cause accepts cast Error — original error preserved as ErrorBaseContract for logging chain"
  - "All UseCases inject only BetterAuthService per Phase 8 design (AuthQueryRepository scaffolded for Phase 9)"

patterns-established:
  - "Application layer import pattern: ApplicationResult (type) from Results, ok/err from Base result-base.ts"
  - "Guard pattern: result.isFailure (property) → early return err(...); then result.data! (non-null assertion)"
  - "try/catch wrapping with UseCaseExecutionError for unexpected errors"

requirements-completed: [APP-USECASES, APP-DTOS, APP-MAPPERS]

# Metrics
duration: 8min
completed: 2026-07-06
---

# Phase 8 Plan 5: Application UseCases Summary

**SignInUseCase, SignUpUseCase, SignOutUseCase, and GetSessionQuery implementing Foundation ICommandHandler/IQueryHandler with InversifyJS decorator injection, client-safe DTOs, and pure mapper functions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06
- **Completed:** 2026-07-06
- **Tasks:** 7
- **Files modified:** 12

## Accomplishments

- **7 DTO interfaces** — SignInDTO, SignUpDTO, SignOutDTO, AuthResponseDTO, UserDTO (no sensitive fields), SessionDTO (ISO string dates), SessionCheckDTO (dual input/output)
- **3 pure mapper functions** — mapUserAggregateToDTO (id/name/email only), mapSessionAggregateToDTO (Date→ISO), mapAuthResultToResponse
- **4 UseCase implementations** — SignInUseCase, SignUpUseCase, SignOutUseCase implementing ICommandHandler; GetSessionQuery implementing IQueryHandler
- **All UseCases registered** in ContainerModule with transient scope (per D-17)
- **Imports verified** — all paths resolve correctly, `npx tsc --noEmit` passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DTOs** — `77e53e5` (feat)
2. **Task 2: Create Application mappers** — `72dc767` (feat)
3. **Task 3: Create SignInUseCase** — `ecd0417` (feat)
4. **Task 4: Create SignUpUseCase** — `9e1624f` (feat)
5. **Task 5: Create SignOutUseCase** — `f494b80` (feat)
6. **Task 6: Create GetSessionQuery** — `9a1fd48` (feat)
7. **Task 7: Update barrels and registration.ts** — `f41f47b` (feat)

## Files Created/Modified

### DTOs
- `src/Modules/Authentication/Application/DTOs/auth.dto.ts` — 7 DTO interfaces with client-safe shapes
- `src/Modules/Authentication/Application/DTOs/index.ts` — Barrel re-export

### Mappers
- `src/Modules/Authentication/Application/Mappers/auth.mapper.ts` — 3 pure mapper functions
- `src/Modules/Authentication/Application/Mappers/index.ts` — Barrel re-export

### UseCases
- `src/Modules/Authentication/Application/UseCases/Commands/sign-in.use-case.ts` — SignInUseCase (ICommandHandler)
- `src/Modules/Authentication/Application/UseCases/Commands/sign-up.use-case.ts` — SignUpUseCase (ICommandHandler)
- `src/Modules/Authentication/Application/UseCases/Commands/sign-out.use-case.ts` — SignOutUseCase (ICommandHandler)
- `src/Modules/Authentication/Application/UseCases/Queries/get-session.query.ts` — GetSessionQuery (IQueryHandler)
- `src/Modules/Authentication/Application/UseCases/Commands/index.ts` — Re-exports 3 command UseCases
- `src/Modules/Authentication/Application/UseCases/Queries/index.ts` — Re-exports GetSessionQuery
- `src/Modules/Authentication/Application/UseCases/index.ts` — Re-exports from Commands and Queries

### Composition
- `src/Modules/Authentication/Composition/registration.ts` — Binds all 4 UseCase classes with transient scope

## Decisions Made

- **SessionCheckDTO duality**: Defined with optional `headers` (for input) and required `user`/`session` (for output) — same type serves both query input and response
- **`ok`/`err` import source**: Imported from `result-base.ts` (not `application-result.ts` which only exports the type alias) — following the existing BetterAuthService pattern
- **Non-null assertions**: Used `result.data!` and `result.error!` after `result.isFailure` check — necessary because `ResultBase` abstract properties aren't discriminated union members
- **All UseCases inject BetterAuthService only**: No repository injection per Phase 8 design (Better Auth handles DB internally)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `isFailure` used as method call (property, not function)**
- **Found during:** Task 3 (SignInUseCase)
- **Issue:** Plan spec used `result.isFailure()` as function call, but `isFailure` is a readonly boolean property in `ResultBase`
- **Fix:** Changed to `result.isFailure` (no parentheses)
- **Files modified:** All 4 UseCase files
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** ecd0417, 9e1624f, f494b80, 9a1fd48

**2. [Rule 1 - Bug] `ok`/`err` imported from wrong module**
- **Found during:** Task 3 (SignInUseCase)
- **Issue:** Plan spec imported `ApplicationResult, ok, err` from Application Results module, but `ok` and `err` are exported from `Base/Abstracts/result-base.ts` (not `application-result.ts`)
- **Fix:** Split imports — `type { ApplicationResult }` from Results, `{ ok, err }` from Base
- **Files modified:** All 4 UseCase files
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** ecd0417, 9e1624f, f494b80, 9a1fd48

**3. [Rule 1 - Bug] `result.data` and `result.error` are possibly undefined**
- **Found during:** Task 3 (SignInUseCase)
- **Issue:** TypeScript cannot narrow `data`/`error` after `isFailure` check because `ResultBase` abstract properties aren't discriminated union members
- **Fix:** Added non-null assertions (`result.data!`, `result.error!`)
- **Files modified:** All 4 UseCase files
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** ecd0417, 9e1624f, f494b80, 9a1fd48

**4. [Rule 1 - Bug] `UseCaseExecutionError.cause` requires `ErrorBaseContract`, not `Error`**
- **Found during:** Task 3 (SignInUseCase)
- **Issue:** Plan passed plain `Error` to `cause`, but `UseCaseExecutionError` constructor expects `ErrorBaseContract` type
- **Fix:** Added `import type { ErrorBase as ErrorBaseContract }` and cast via `as unknown as ErrorBaseContract`
- **Files modified:** All 4 UseCase files
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** ecd0417, 9e1624f, f494b80, 9a1fd48

**5. [Rule 2 - Missing Critical] `SessionCheckDTO.headers` required but absent in return objects**
- **Found during:** Task 6 (GetSessionQuery)
- **Issue:** `SessionCheckDTO` had `headers: Headers` as required, but `GetSessionQuery` returns `{ user, session }` without headers; with `exactOptionalPropertyTypes`, this caused type errors
- **Fix:** Changed `headers` to optional (`headers?: Headers | undefined`) and added non-null assertion on input (`dto.headers!`)
- **Files modified:** `auth.dto.ts`, `get-session.query.ts`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 9a1fd48

---

**Total deviations:** 5 auto-fixed (4 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for TypeScript correctness. No scope creep. Pattern established for all future UseCase implementations.

## Issues Encountered

- **TS strict mode with `exactOptionalPropertyTypes`**: Optional property handling required adjusting the `SessionCheckDTO.headers` field — necessary pattern for dual-use DTOs that serve as both input and output types
- **Plan spec alignment with actual Foundation types**: The plans used simplified code examples that didn't account for strict TypeScript narrowing and the actual type signatures of `ResultBase`/`UseCaseExecutionError`. Auto-fixes applied to make real code compile.

## Next Phase Readiness

- All 4 UseCase implementations complete and type-checked
- UseCase barrels export all classes
- `registration.ts` binds all UseCase classes with transient scope
- Ready for 08-06 (Infrastructure Drizzle repositories) and 08-07 (Server Actions resolving from container)

## Self-Check: PASSED

- ✅ All 13 files exist
- ✅ 8 commits in git history
- ✅ `npx tsc --noEmit` passes with no errors

---

*Phase: 08-module-integration-server-actions*
*Completed: 2026-07-06*
