---
phase: 08-module-integration-server-actions
plan: 06
subsystem: auth
tags: [drizzle, repositories, infrastructure, mappers, di, inversifyjs]
---

# Dependency graph
requires:
  - phase: 03
    provides: DomainError, DomainResult
  - phase: 04
    provides: Application layer contracts
  - phase: 05
    provides: InfrastructureError, InfrastructureResult, withRetry, withTimeout
  - phase: 08-02
    provides: BetterAuthService
  - phase: 08-04
    provides: AuthQueryRepository interface, AuthenticatedUser aggregate, AUTH_TOKENS.QUERY_AUTH_REPOSITORY
  - phase: 08-05
    provides: Application UseCases, DTOs, ContainerModule pattern
provides:
  - DrizzleAuthQueryRepository (@injectable()) implementing AuthQueryRepository
  - mapUserRowToAggregate() pure function mapper (Drizzle row → AuthenticatedUser)
  - AUTH_TOKENS.DRIZZLE_CLIENT binding as toConstantValue(getDatabaseClient())
  - Updated registration.ts with repository + DrizzleClient bindings
affects: [08-07, 08-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@injectable() + @inject(AUTH_TOKENS.DRIZZLE_CLIENT) for repository DI"
    - "Pure function mappers (no classes/decorators) with $inferSelect row types"
    - "DB query wrapping with try/catch → InfrastructureError wrapped as any for DomainResult compatibility"

key-files:
  created:
    - src/Modules/Authentication/Infrastructure/Mappers/drizzle-to-domain.mapper.ts
    - src/Modules/Authentication/Infrastructure/Mappers/index.ts
    - src/Modules/Authentication/Infrastructure/Repositories/Queries/drizzle-auth-query.repository.ts
  modified:
    - src/Modules/Authentication/Composition/tokens.ts (+DRIZZLE_CLIENT)
    - src/Modules/Authentication/Composition/registration.ts (+DrizzleClient binding, +DrizzleAuthQueryRepository binding)
    - src/Modules/Authentication/Infrastructure/Repositories/Queries/index.ts
  deleted:
    - src/Modules/Authentication/Infrastructure/Mappers/Queries/index.ts (empty — replaced by parent-level barrel)

key-decisions:
  - "DrizzleClient bound as toConstantValue(getDatabaseClient()) — singleton connection pool"
  - "DrizzleAuthQueryRepository uses transient scope per D-17"
  - "No Command repository in Phase 8 — all auth commands delegated to BetterAuth"
  - "InfrastructureError (DatabaseQueryError) cast via `as any` for DomainResult compatibility — expected given DomainResult<T, DomainError> type parameter"
  - "query field omitted from DatabaseQueryError — plan included it but actual class constructor doesn't accept query param"

# Verification
- `npx tsc --noEmit` passes with zero errors
- Repository class has @injectable() decorator
- Constructor uses @inject(AUTH_TOKENS.DRIZZLE_CLIENT)
- Implements AuthQueryRepository (findByEmail, findById)
- Not-found returns ok(null), not an error
- Mapper is pure function (no decorators)
- registration.ts binds DrizzleClient + query repository
- No Command repository implementation