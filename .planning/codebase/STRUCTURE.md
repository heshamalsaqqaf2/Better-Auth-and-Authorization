# Codebase Structure

**Analysis Date:** 2026-06-07

## Directory Layout

```
authentication-better-auth/
├── .agents/                      # Agent skills and instructions
│   └── skills/                   # Installable agent skills
├── .planning/
│   └── codebase/                 # Codebase analysis documents (this file)
├── docs/
│   ├── Architecture.md           # Hybrid architecture specification (Arabic)
│   └── Base_System.md            # Layered Error & Result system specification (Arabic)
├── public/                       # Static assets
├── src/
│   ├── app/                      # Next.js 16 App Router Pages
│   │   ├── (admin)/              # Route group: admin section
│   │   │   └── dashboard/        # Admin dashboard page (empty)
│   │   ├── (user)/               # Route group: user section
│   │   │   └── dashboard/        # User dashboard page (empty)
│   │   ├── api/                  # API routes (empty)
│   │   ├── favicon.ico
│   │   ├── globals.css           # Tailwind v4 + shadcn theme (OKLCH)
│   │   ├── layout.tsx            # Root layout: fonts, providers
│   │   └── page.tsx              # Home page (placeholder)
│   ├── CompositionRoot/          # DI Container (Modern Composition Root)
│   │   ├── Bindings/
│   │   │   └── index.ts          # (empty placeholder)
│   │   ├── Containers/
│   │   │   └── index.ts          # (empty placeholder)
│   │   └── container.ts          # (empty placeholder)
│   ├── Core/                     # Architecture core
│   │   ├── Foundations/          # Four architectural layers
│   │   │   ├── Base/             # Abstract base classes
│   │   │   │   ├── Abstracts/    # error-base.ts, result-base.ts
│   │   │   │   ├── TypeGuards/   # base-error, base-result type guards
│   │   │   │   └── Validators/   # base-error, base-result validators
│   │   │   ├── Domain/           # Domain Layer (OOP)
│   │   │   │   ├── Errors/       # DomainError + specific errors (User, Complaint)
│   │   │   │   └── Results/      # DomainResult monad
│   │   │   ├── Application/      # Application Layer (OOP)
│   │   │   │   ├── Errors/       # ApplicationError + specific errors (Usecase, Validation)
│   │   │   │   ├── Mappers/      # Domain-to-Application error mapper
│   │   │   │   └── Results/      # ApplicationResult monad
│   │   │   ├── Infrastructure/   # Infrastructure Layer (OOP)
│   │   │   │   ├── Errors/       # InfrastructureError + specific (DB, Network, Cache)
│   │   │   │   ├── Mappers/      # Application-to-Infrastructure error mapper
│   │   │   │   └── Results/      # InfrastructureResult monad
│   │   │   └── Presentation/     # Presentation Layer (DU)
│   │   │       ├── Errors/       # PresentationError (DU) + specific (Validation, Network, System)
│   │   │       ├── Mappers/      # Application-to-Presentation error + result mappers
│   │   │       └── Results/      # PresentationResult (DU)
│   │   └── Kernel/               # Framework-agnostic primitives
│   │       ├── Constants/        # error-codes, layer-names
│   │       ├── Contracts/        # Base contracts + validators
│   │       └── Primitives/       # Enums (LayerType, Severity), Types (CorrelationId, ErrorCode, OperationId)
│   ├── Lib/                      # Third-party integrations
│   │   ├── BetterAuth/           # Better Auth auth library
│   │   │   ├── Config/           # server.ts, client.ts (empty placeholders)
│   │   │   └── utils/            # get-session.ts (empty placeholder)
│   │   └── Drizzle/              # Drizzle ORM + PostgreSQL
│   │       ├── Config/           # drizzle.config.ts, drizzle.client.ts
│   │       └── Database/
│   │           ├── Schema/       # Schema aggregator (index.ts)
│   │           ├── connection.pool.ts
│   │           └── index.ts      # Public API re-exports
│   ├── Modules/                  # Feature modules (DDD Bounded Contexts)
│   │   └── Authentication/       # Authentication module
│   │       ├── Application/
│   │       │   └── UseCases/
│   │       │       ├── Commands/ # (empty placeholder)
│   │       │       └── Queries/  # (empty placeholder)
│   │       ├── Domain/
│   │       │   └── Repositories/
│   │       │       ├── Commands/ # (empty placeholder)
│   │       │       └── Queries/  # (empty placeholder)
│   │       ├── Infrastructure/
│   │       │   ├── Database/
│   │       │   │   ├── Relations/  # Drizzle relations (user<->session<->account)
│   │       │   │   └── Schema/     # user, session, account, verification tables
│   │       │   └── Repositories/
│   │       │       ├── Commands/ # (empty placeholder)
│   │       │       └── Queries/  # (empty placeholder)
│   │       └── Presentation/     # (no files)
│   ├── Scripts/                  # Utility scripts
│   │   ├── test-db.ts            # Database connection test
│   │   └── debug-env.ts          # Environment debug tool
│   └── Shared/                   # Cross-module shared code
│       ├── actions/              # Server actions (empty)
│       ├── components/
│       │   ├── customs/          # Custom components (empty)
│       │   ├── layouts/          # Layout components (empty)
│       │   ├── providers/        # provider.tsx (NextTopLoader, Toaster)
│       │   └── ui/               # 50+ shadcn/ui components
│       ├── hooks/
│       │   └── use-mobile.ts     # Mobile breakpoint hook
│       └── utils/
│           └── utils.ts          # cn() utility (clsx + tailwind-merge)
├── .env.local                    # Environment variables (gitignored)
├── .gitignore
├── AGENTS.md                     # Agent instructions
├── AGENTS_SKILLS.json            # Skills manifest
├── biome.json                    # Biome linter + formatter config
├── CLAUDE.md                     # Claude agent config (references AGENTS.md)
├── components.json               # shadcn/ui config
├── next.config.ts                # Next.js config (default)
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss
├── proxy.ts                      # Middleware placeholder (empty)
├── skills-lock.json              # Installed skills manifest
└── tsconfig.json                 # TypeScript config (@/* → ./src/*)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js 16 App Router pages and layouts (should only contain page/layout files, no logic)
- Contains: Route groups `(admin)/` and `(user)/`, root layout, globals CSS
- Key files: `layout.tsx` (root layout with Geist/Inter fonts, provider wrapper), `globals.css` (Tailwind v4 + shadcn themes)

**`src/Core/`:**
- Purpose: Architecture backbone — layered Error/Result system and framework-agnostic Kernel
- Contains: `Foundations/` (5 sublayers: Base, Domain, Application, Infrastructure, Presentation), `Kernel/` (contracts, primitives, constants)
- Key files: All files are currently empty placeholder stubs (scaffolding only)

**`src/Core/Kernel/`:**
- Purpose: Framework-agnostic core primitives with zero external dependencies
- Contains: Contracts (error-base, result-base, validators), Primitives (Enums, Types), Constants
- Pattern: Used as foundation for all layer types

**`src/Modules/Authentication/`:**
- Purpose: DDD Bounded Context for authentication feature
- Contains: Domain (repository interfaces), Application (use cases), Infrastructure (DB schema + relations + repositories), Presentation (server actions — empty)
- Key files: User/Session/Account/Verification Drizzle schemas at `src/Modules/Authentication/Infrastructure/Database/Schema/`

**`src/Lib//`:**
- Purpose: Third-party integration configuration and client setup
- Contains: `Drizzle/` (PostgreSQL connection pool, Drizzle client, migration config), `BetterAuth/` (auth server/client config placeholders)
- Key files: `drizzle.client.ts` (singleton DB client), `connection.pool.ts` (pool sizing)

**`src/Shared/`:**
- Purpose: Cross-module reusable code
- Contains: UI components (50+ shadcn/ui primitives), providers, hooks (`use-mobile`), utils (`cn()`)
- Key files: `provider.tsx` (app-wide provider composition), `utils.ts` (`cn()` utility)
- Note: `actions/`, `customs/`, `layouts/` are empty — ready for shared server actions and layout components

**`src/CompositionRoot/`:**
- Purpose: Dependency Injection container following Modern Composition Root pattern
- Contains: `Bindings/`, `Containers/`, `container.ts` (all empty placeholders)
- Will house DI bindings for repositories, use cases, and services

**`src/Scripts/`:**
- Purpose: Standalone utility scripts run via `tsx`
- Contains: `test-db.ts` (connection health check), `debug-env.ts` (env variable inspection)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout — first point of entry for all pages
- `src/app/page.tsx`: Home page (placeholder)
- `src/app/(admin)/dashboard/`: Admin dashboard (empty)
- `src/app/(user)/dashboard/`: User dashboard (empty)

**Configuration:**
- `next.config.ts`: Next.js configuration (default)
- `tsconfig.json`: TypeScript config with `@/*` alias
- `biome.json`: Linting and formatting (Biome 2.4.16)
- `postcss.config.mjs`: PostCSS with Tailwind v4
- `components.json`: shadcn/ui configuration (base-mira style)
- `drizzle.config.ts` (in `src/Lib/Drizzle/Config/`): Drizzle Kit config for migrations

**Core Logic:**
- `src/Lib/Drizzle/Config/drizzle.client.ts`: Drizzle ORM client (Singleton + Proxy pattern)
- `src/Lib/Drizzle/Database/connection.pool.ts`: PostgreSQL pool configuration
- `src/Modules/Authentication/Infrastructure/Database/Schema/`: Drizzle table definitions (user, session, account, verification)
- `src/Modules/Authentication/Infrastructure/Database/Relations/relations.ts`: Table relationships

**Testing:**
- `src/Scripts/test-db.ts`: Manual database connection test script
- (No automated test framework — no Jest/Vitest/Playwright config)

## Naming Conventions

**Files:**
- `kebab-case` for general files: `connection.pool.ts`, `drizzle.config.ts`, `user.schema.ts`, `error-base.ts`, `use-mobile.ts`
- PascalCase for components: `provider.tsx`, `tooltip.tsx`, `button.tsx`, `input.tsx`
- Dot-separated suffixes indicate role: `*.contract.ts` (interfaces), `*.type-guard.ts`, `*.validator.ts`, `*.error.ts`, `*.schema.ts`, `*.constants.ts`, `*.enum.ts`, `*.type.ts`
- Barrel files always `index.ts`

**Directories:**
- PascalCase for top-level source directories: `Core`, `Lib`, `Modules`, `Shared`, `Scripts`, `CompositionRoot`
- PascalCase for module layers: `Domain`, `Application`, `Infrastructure`, `Presentation`
- PascalCase for layer subgroups: `Errors`, `Results`, `Mappers`, `TypeGuards`, `Validators`, `Abstracts`
- PascalCase for specific error groups: `UserErrors`, `ComplaintErrors`, `DatabaseErrors`, `NetworkErrors`
- Route groups use parentheses: `(admin)`, `(user)`

## Where to Add New Code

**New Feature Module:**
- Create new directory under `src/Modules/[Name]/` with subdirectories: `Domain/`, `Application/`, `Infrastructure/`, `Presentation/`
- Add DB schema to `Infrastructure/Database/Schema/`
- Register in `src/Lib/Drizzle/Database/Schema/index.ts`
- Mirror the Authentication module structure

**New Page:**
- Primary code: `src/app/` (App Router conventions)
- Use route groups `(admin)/`, `(user)/` for role-based sections
- Keep pages thin — import components from `src/Shared/components/` and `src/Modules/*/Presentation/`

**New UI Component:**
- shadcn/ui primitives: `src/Shared/components/ui/[name].tsx`
- Custom components: `src/Shared/components/customs/[name].tsx`
- Layout components: `src/Shared/components/layouts/[name].tsx`
- Add provider to `src/Shared/components/providers/provider.tsx` if needed

**New Server Action:**
- Module-specific: `src/Modules/[Name]/Presentation/actions.ts`
- Shared actions: `src/Shared/actions/[name].ts`
- Must return `PresentationResult<T>` (Discriminated Union)

**New UseCase:**
- Command: `src/Modules/[Name]/Application/UseCases/Commands/[command-name].handler.ts`
- Query: `src/Modules/[Name]/Application/UseCases/Queries/[query-name].handler.ts`
- Must return `ApplicationResult<T, ApplicationError>`

**New Database Migration:**
- Run `pnpm db:drizzleGenerate` to generate migration SQL
- Run `pnpm db:drizzleMigrate` to apply
- Migration output goes to `src/lib/drizzle/database/migrations/`

**New Shared Utility:**
- `src/Shared/utils/[name].ts` — Export from `index.ts`
- Follow `cn()` pattern in `src/Shared/utils/utils.ts`

## Special Directories

**`.agents/skills/`:**
- Purpose: Agent skill definitions (better-auth, nextjs, shadcn, etc.)
- Generated: No
- Committed: Yes

**`docs/`:**
- Purpose: Architecture documentation in Arabic (hybrid architecture specification, error/result system)
- Generated: No
- Committed: Yes

**`src/Lib/Drizzle/Database/migrations/`:**
- Purpose: Auto-generated SQL migration files from Drizzle Kit (empty until migrations are run)
- Generated: Yes
- Committed: Expected (track schema changes)

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-06-07*
