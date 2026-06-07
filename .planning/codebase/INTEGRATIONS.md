# External Integrations

**Analysis Date:** 2026-06-07

## APIs & External Services

**Authentication:**
- **Better Auth ^1.6.14** - Full-stack authentication library
  - SDK/Client: `better-auth` (npm)
  - Server config placeholder: `src/Lib/BetterAuth/Config/server.ts` (empty)
  - Client config placeholder: `src/Lib/BetterAuth/Config/client.ts` (empty)
  - Supported features: Email/password, OAuth social providers, session management, rate limiting, plugins (2FA, passkey, organization, magic link, etc.)
  - Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` from `.env.local`
  - Client hook file: `src/Lib/BetterAuth/utils/get-session.ts` (empty placeholder)
  - Route handler: Not yet created (expected at `/api/auth/[...all]/route.ts`)

## Data Storage

**Databases:**
- **PostgreSQL** (via `pg` driver ^8.21.0)
  - Connection: `DATABASE_URL` from `.env.local`
  - Format: `postgresql://user:password@host:5432/dbname`
  - Validated in `src/Lib/Drizzle/Database/connection.pool.ts` (lines 43-54)
  - Connection pool: Singleton pattern in `src/Lib/Drizzle/Config/drizzle.client.ts`
    - Pool config at `src/Lib/Drizzle/Database/connection.pool.ts` (lines 22-36)
    - Production: max=20, min=5; Development: max=10, min=2

**ORM/Query Builder:**
- **Drizzle ORM ^0.45.2** - Type-safe SQL ORM
  - Client: `drizzle-orm/node-postgres`
  - Schema location: `src/Lib/Drizzle/Database/Schema/index.ts` (aggregator)
  - Config: `src/Lib/Drizzle/Config/drizzle.config.ts`
    - Dialect: `postgresql`
    - Migrations out: `src/lib/drizzle/database/migrations/`
    - Migration prefix: `timestamp`
    - Tracking table: `__drizzle_migrations__`
    - Schema: `public`
  - Migration CLI: `drizzle-kit` via `pnpm db:drizzleMigrate`
  - Health check: `checkDatabaseHealth()` at `src/Lib/Drizzle/Config/drizzle.client.ts` (lines 62-77)
  - Graceful shutdown: `closeDatabaseConnections()` (lines 83-91)

**Database Schema (Authentication Module):**
- Four tables defined as Drizzle `pgTable` in `src/Modules/Authentication/Infrastructure/Database/Schema/`:
  - `user` (`src/Modules/Authentication/Infrastructure/Database/Schema/user.schema.ts`) - id (uuid, PK), name, email (unique), emailVerified, image, createdAt, updatedAt
  - `session` (`src/Modules/Authentication/Infrastructure/Database/Schema/session.schema.ts`) - id (uuid, PK), expiresAt, token (unique), ipAddress, userAgent, userId (FK -> user)
  - `account` (`src/Modules/Authentication/Infrastructure/Database/Schema/account.schema.ts`) - id (uuid, PK), accountId, providerId, userId (FK -> user), accessToken, refreshToken, idToken, scope, password
  - `verification` (`src/Modules/Authentication/Infrastructure/Database/Schema/verification.schema.ts`) - id (uuid, PK), identifier, value, expiresAt
- Relations: `src/Modules/Authentication/Infrastructure/Database/Relations/relations.ts`

**File Storage:**
- Local filesystem only (no cloud storage integration detected)

**Caching:**
- Not yet configured (Better Auth supports `secondaryStorage` for Redis/KV but not set up yet)

## Authentication & Identity

**Auth Provider:**
- **Better Auth** (self-hosted)
  - Implementation: Not yet fully wired (server.ts and client.ts are empty placeholders)
  - Expected setup per `auth:betterAuthGenerate` script in `package.json`:
    ```
    pnpm dlx auth@latest generate --config ./src/core/foundations/infrastructure/services/better-auth/auth-server.ts --output ./src/core/foundations/infrastructure/services/better-auth/generated-betterAuthGenerate.ts
    ```
  - Config path referenced: `src/core/foundations/infrastructure/services/better-auth/auth-server.ts` (does not match current directory structure)

**Social OAuth:**
- Not yet configured (Better Auth supports Google, GitHub, etc. via `socialProviders` config)

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logging:**
- `console.log`/`console.error` used throughout (no structured logging library)
- Drizzle ORM query logging enabled in dev mode via `logger: process.env.NODE_ENV === "development"` in `src/Lib/Drizzle/Config/drizzle.client.ts` (line 44)

## CI/CD & Deployment

**Hosting:**
- Not configured (no Dockerfile, no vercel.json, no platform config detected)

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Encryption secret (min 32 chars)
- `BETTER_AUTH_URL` - Base URL of the application
- `NODE_ENV` - Environment mode (development/production)

**Secrets location:**
- `.env.local` file at project root (listed in `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

---

*Integration audit: 2026-06-07*
