# Technology Stack

**Analysis Date:** 2026-06-07

## Languages

**Primary:**
- TypeScript ^5 - Entire application (server components, client components, server actions, database schema, utility code)

**Styling:**
- CSS (Tailwind CSS v4 directives via `@import "tailwindcss"`)
- CSS custom properties for theming (OKLCH color space in `src/app/globals.css`)

## Runtime

**Environment:**
- Node.js (via Next.js 16.2.7 standalone server)

**Package Manager:**
- pnpm (lockfile: `pnpm-lock.yaml` present)
- Lockfile committed: Yes

## Frameworks

**Core:**
- **Next.js 16.2.7** - React framework with App Router (RSC, Server Actions, Route Groups)
  - Config: `next.config.ts` (minimal, default)
  - Middleware: `proxy.ts` (empty placeholder file in root)
- **React 19.2.4** - UI library
  - `react-dom` 19.2.4 for rendering

**Testing:**
- Not detected (no Jest/Vitest/Playwright config files found)

**Build/Dev:**
- **TypeScript ^5** - Compilation and type checking (`tsconfig.json` with `bundler` module resolution)
- **tsx ^4.22.4** - TypeScript execution for scripts (used in `db:test` and `db:debug` scripts)
- **Biome 2.4.16** - Linting and formatting (replaces ESLint + Prettier)
  - Config: `biome.json` with VCS integration, auto-organize imports
  - Domains: `next` (recommended), `react` (recommended)

## Key Dependencies

**Authentication:**
- **better-auth ^1.6.14** - Full-featured auth library with session management, OAuth, email/password, plugins
  - Server config location: `src/Lib/BetterAuth/Config/server.ts` (empty placeholder)
  - Client config location: `src/Lib/BetterAuth/Config/client.ts` (empty placeholder)

**Database:**
- **drizzle-orm ^0.45.2** - Type-safe SQL ORM/query builder
- **drizzle-kit ^0.31.10** - Migration generation and management (CLI)
- **pg ^8.21.0** - PostgreSQL client (native driver)
  - Types: `@types/pg ^8.20.0`
- **kysely 0.28.17** - Also present as dependency (may be for future use or migration tooling)

**UI Components:**
- **shadcn/ui** (`shadcn ^4.10.0`) - Component system via `components.json` config
  - Style: `base-mira`, RTL enabled, icon library: lucide
  - CSS via `@import "shadcn/tailwind.css"` in `globals.css`
  - 50+ UI component files in `src/Shared/components/ui/`
- **@base-ui/react ^1.5.0** - Base UI primitives
- **@tanstack/react-form ^1.33.0** - Form state management
- **@tanstack/react-store ^0.11.0** - State management
- **tailwind-merge ^3.6.0** + **clsx ^2.1.1** - Class name merging (via `cn()` utility)
- **class-variance-authority ^0.7.1** - Component variant construction

**UI Utilities:**
- **lucide-react ^1.17.0** - Icon library
- **cmdk ^1.1.1** - Command menu primitive
- **sonner ^2.0.7** - Toast notifications
- **nextjs-toploader ^3.9.17** - Top loading bar (configured in `provider.tsx`)
- **next-themes ^0.4.6** - Theme switching (present but not wired in `provider.tsx`)
- **vaul ^1.1.2** - Drawer component
- **embla-carousel-react ^8.6.0** - Carousel
- **input-otp ^1.4.2** - OTP input
- **react-day-picker ^10.0.1** - Date picker
- **date-fns ^4.4.0** - Date utilities
- **react-resizable-panels ^4.11.2** - Resizable panel layouts
- **recharts 3.8.0** - Charting library
- **tw-animate-css ^1.4.0** - Tailwind animation utilities

**Validation:**
- **zod ^4.4.3** - Schema validation

**Environment:**
- **dotenv ^17.4.2** - Env file loading (used in Drizzle config and debug scripts)

## Configuration

**Environment:**
- `.env.local` - Exists, contains `DATABASE_URL` and `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` (not read for security)
- `process.env` access via `dotenv` in scripts
- `NODE_ENV` used to differentiate dev/prod connection pool settings

**Build:**
- `tsconfig.json` - Strict mode, `@/*` path alias mapped to `./src/*`
- `next.config.ts` - Default config (no custom webpack, no image domains)
- `postcss.config.mjs` - PostCSS with `@tailwindcss/postcss` plugin
- `biome.json` - Formatter (2-space indent), linter (recommended + Next.js/React domains)

## Platform Requirements

**Development:**
- Node.js 18+ (Next.js 16 compatible)
- PostgreSQL database (local or remote)
- pnpm package manager

**Production:**
- Node.js runtime (Next.js standalone or Vercel)
- PostgreSQL database with `DATABASE_URL` configured
- Better Auth requires `BETTER_AUTH_SECRET` (32+ chars) and `BETTER_AUTH_URL`

---

*Stack analysis: 2026-06-07*
