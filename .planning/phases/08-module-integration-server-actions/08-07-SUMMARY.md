# 08-07 SUMMARY: Server Actions

**Wave:** 5
**Commit:** `2031f1d`
**Date:** 2026-07-11

## What was built

| File | Purpose |
|------|---------|
| `src/Modules/Authentication/Presentation/Types/action.types.ts` | SignInFormState, SignUpFormState, SignOutFormState types |
| `src/Modules/Authentication/Presentation/Types/index.ts` | Barrel for action types |
| `src/Modules/Authentication/Presentation/Actions/sign-in.action.ts` | Sign-in Server Action with InversifyJS container resolution |
| `src/Modules/Authentication/Presentation/Actions/sign-up.action.ts` | Sign-up Server Action with InversifyJS container resolution |
| `src/Modules/Authentication/Presentation/Actions/sign-out.action.ts` | Sign-out Server Action with InversifyJS container resolution |
| `src/Modules/Authentication/Presentation/Actions/index.ts` | Barrel for all Server Action functions |
| `src/app/api/auth/[...all]/route.ts` | Better Auth API catch-all route handler |

## Architecture decisions

- **InversifyJS resolution via `resolve<T>()`** — all actions use `resolve<UseCase>(AUTH_TOKENS.XXX)` where `resolve` is the only exported DI accessor (container is private per D-19)
- **AsyncLocalStorage initialization via `withRequestContextFromHeaders()`** — reads `x-correlation-id` from `next/headers()`, initializes ALS scope, makes `getCorrelationId()` available for `RequestContext`
- **`ApplicationResult` → `PresentationResult` mapping** — sign-in/sign-up use `mapApplicationToPresentationResult(response, { operationName })`. Sign-out uses `match` directly with `successResult(null, ...)` because `SignOutUseCase` returns `ApplicationResult<void>` (side-effect only)
- **Validation at Server Action boundary** — email/password required checks use `createValidationError` with `BAD_REQUEST` error code before calling UseCase
- **Unexpected error catch-all** — all actions wrap body in try/catch, returning `createSystemError` with `INTERNAL_ERROR` code and generic user message
- **Sign-out returns `PresentationResult<null>`** — side-effect only, no data returned per D-03

## Verification

- `npx tsc --noEmit` passes with zero errors
- Each Server Action is one file with a single exported function (D-01)
- Every action returns `PresentationResult<T | null>` (D-03)
- Actions resolve UseCases via `resolve<T>(AUTH_TOKENS.XXX)` (container is private)
- Actions create `RequestContext` from AsyncLocalStorage and pass to `useCase.execute(dto, ctx)`
- Basic form validation before calling UseCases
- Better Auth API route handler wired at `src/app/api/auth/[...all]/route.ts`

## Remaining plans after Wave 5

- 08-08: Auth pages (sign-in, sign-up) with @tanstack/react-form
- 08-09: Dashboards + global + per-route error boundaries
