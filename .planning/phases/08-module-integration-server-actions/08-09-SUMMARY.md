# 08-09: Dashboards + Error Boundaries

## Objective
Create user and admin dashboard pages, sign-out button component, and global + per-route error boundaries.

## Completed

| Task | Status | Files |
|------|--------|-------|
| 1. Sign-out button component | ✅ | `src/Modules/Authentication/Presentation/Components/sign-out-button.tsx` |
| 2. User navigation component | ✅ | `src/Modules/Authentication/Presentation/Components/user-nav.tsx` |
| 3. User dashboard page and layout | ✅ | `src/app/(user)/dashboard/page.tsx`, `src/app/(user)/dashboard/layout.tsx` |
| 4. Admin dashboard page and layout | ✅ | `src/app/(admin)/dashboard/page.tsx`, `src/app/(admin)/dashboard/layout.tsx` |
| 5. Per-route error boundaries | ✅ | `src/app/(user)/dashboard/error.tsx`, `src/app/(admin)/dashboard/error.tsx` |
| 6. Global error boundary | ✅ | `src/app/error.tsx` |
| 7. Components barrel update | ✅ | `src/Modules/Authentication/Presentation/Components/index.ts` |
| 8. getSession utility | ✅ | `src/Lib/BetterAuth/utils/get-session.ts` |

## Key Decisions

- **Next.js 16 `unstable_retry`**: Per-route and root error boundaries use `unstable_retry` (not `reset`) to match Next.js 16 file convention API.
- **Error function naming**: Renamed from `Error` to `DashboardError`/`RootError` to satisfy Biome `noShadowRestrictedNames` lint rule. Next.js still uses the default export regardless of internal name.
- **Link styling**: Error boundary "Go to Sign In" and "Go to User Dashboard" links use inline Tailwind classes matching shadcn Button outline variant styling (since `asChild` prop is not supported by the project's Button component).
- **SignOutButton error display**: Accesses `userMessage` only when it exists on the error shape (guarded by `"userMessage" in state.error`) since `ValidationErrorShape` lacks `userMessage`.
- **Session check**: Both dashboard layouts use the new `getSession(headers)` utility which calls `auth.api.getSession({ headers })` directly (no InversifyJS).

## Verification
- `npx tsc --noEmit` passes cleanly (0 errors)
- No InversifyJS imports in any UI component
- Error boundaries log full cause-chain context (`error.message`, `error.cause`, `error.digest`)
- All 8 commits atomic per task

## Commits
```
dd3156b feat(08-09): update components barrel with SignOutButton and UserNav exports
5bb6f58 feat(08-09): add root error boundary with generic recovery UI
b2874db feat(08-09): add per-route error boundaries for dashboards
2604e90 feat(08-09): add admin dashboard layout and page with session check
06beb48 feat(08-09): add user dashboard layout and page with session check
4222dba feat(08-09): add UserNav component with user info and sign-out
c71e12b feat(08-09): add SignOutButton component with useActionState
d5b5a45 feat(08-09): add getSession utility for server-side session checks
```
