# Feature: fase1-fundaciones

Mirror: Engram topic `odd/fase1-fundaciones/tasks` (project mhk). Status of mirror: pending.

## Objective
Base of the MHK wholesale store: Next.js app, local Supabase, base schema, auth with roles (`admin`, `cliente`), RLS, CI.

## Scope (authorized)
Phase 1 only: scaffold, local Supabase, profiles + roles + RLS, auth (login, registration pending admin approval), role-protected shells, tests, CI. No catalog, orders, pricing or ARCA yet.

## Constraints
- Stack: Next.js App Router + TS, Tailwind + shadcn/ui, Supabase (local via Docker Desktop, `docker.exe`), Vercel later. Cloud Supabase project comes later; keep config env-driven.
- Windows filesystem (`/mnt/c`), WSL has no node; use Windows `node.exe`/`npm`/`pnpm`.
- Conventional commits, no AI attribution (user rule).
- ~400 authored changed lines per task is a planning heuristic only.
- Forecast: ~1200-1600 authored lines total, delivery strategy `ask-on-risk`.

## Tasks
- [x] T1 Scaffold: Next.js + TS + Tailwind + shadcn/ui, eslint/prettier, vitest, pnpm scripts, .gitignore, .env.example
- [x] T2 Local Supabase: `supabase init`, config, `@supabase/ssr` clients (server/browser/middleware), env validation
- [x] T3 Schema + RLS: migration for `profiles` (role, status pending/approved/rejected, CUIT, tax condition), trigger on `auth.users`, RLS policies, seed admin; SQL tests
- [x] T4 Auth + role shells: login, register (pending approval), middleware guards, `/admin` and `/tienda` placeholder layouts, tests
- [ ] T5 CI: GitHub Actions (lint, typecheck, unit tests, supabase db tests)
- [ ] T6 Design tokens: `DESIGN.md` + Tailwind tokens from `public/mhk logo.png` via impeccable, applied to login and shells

## Route per task
Recorded as tasks start (inline vs delegated, with trigger evidence).
- T1+T2: delegated direct, one writer (writer trigger: 2+ non-trivial files, scaffolding + dependency installs).

## Progress / evidence
- Branch `feat/fase1-fundaciones` created. Git identity set repo-locally (alandi1999 / alandiofficial@gmail.com).
- Parent spot check: `pnpm test` 7/7 pass.

- T1/T2 verified (commit pending, parent commits): `pnpm lint` ok, `pnpm typecheck` ok (runs `next typegen` first), `pnpm test` 2 files / 7 tests pass, `pnpm build` ok, `pnpm format:check` ok.
- T2 env validation (`src/lib/env.ts`) done test-first: RED observed (unresolved import), then GREEN (6 tests). Scaffold/config exempt from RED (no meaningful runnable test); covered by build/lint/typecheck and a Button smoke test.
- `pnpm db:start` booted local Supabase (API http://127.0.0.1:54321, auth health 200, db/auth/kong/rest/storage healthy), then `pnpm db:stop`. `supabase_vector` container keeps restarting on Docker Desktop (log shipper only, non-blocking). Local keys live in untracked `.env.local`.
- Deviations: Next 16.4.4 warns `middleware` is deprecated in favor of `proxy`; kept `src/middleware.ts` per spec (works, build passes). create-next-app enabled `cacheComponents` and `partialPrefetching` in next.config.ts (kept). shadcn registry emitted a bogus `cn` package import/util; replaced with standard clsx + tailwind-merge `src/lib/utils.ts`. Removed generated AGENTS.md.
- T3: delegated direct writer (trigger: 2+ non-trivial files). RED observed (`is_valid_cuit` missing, 0/24), then GREEN: `pnpm db:reset` ok (migration + seed), `pnpm db:test` 24/24 pass, typecheck/lint/test(7)/build/format:check ok. Clients typed with `Database` generic (trivial). Decision: invalid CUIT in signup metadata aborts signup (CHECK violation 23514), not silently nulled. Commit pending (parent).

- T4: delegated direct writer (trigger: 2+ non-trivial files). RED observed (4 test files failed on unresolved imports: cuit, access, safe-next, schemas), then GREEN (89 tests). Pages/actions exempt from RED; covered by typecheck/lint/build + manual flow. `src/middleware.ts` replaced by `src/proxy.ts` (build no longer warns). shadcn `input`/`label` re-introduced the bogus `cn` import and dependency; fixed to `@/lib/utils` and `cn` removed. Added `server-only`.
- T4 manual verification (dev server + curl.exe replaying the progressive-enhancement form POSTs): anon /tienda -> /login?next=%2Ftienda; seeded admin login -> /admin/clientes (honours safe next); `next=//evil.com` falls back to /admin; wrong password -> "Email o contraseña incorrectos."; invalid and duplicate CUIT -> generic "No pudimos crear la cuenta..." message; valid signup -> pending profile + /cuenta/pendiente; pending user /tienda and /admin -> /cuenta/pendiente; non-admin posting the approve action -> no change (redirected, DB unchanged); admin approve -> DB status approved; then client /tienda 200 (greeting with razon social), /admin and /login -> /tienda. Not verified: layout guards independently of the proxy (proxy always runs first), email confirmation ON path, browser JS-enabled UX.
- T4 decisions: admin list does not show email (lives in auth.users; would need service role or a SQL view); admin cannot approve/reject themselves; missing profile = treated as not approved.

- T4 commits: 880fad5, 8c651ca. Native review: risk high, review granted by the user; candidate = T4 range (32 files, 1227 lines, base b331730) reviewed with 4 lenses on an ext4 clone (`~/mhk-review`) because the Linux gentle-ai timed out on /mnt/c and the Windows build cannot launch the WSL-only `claude`. Outcome: approved and acknowledged (authority burned), security lens had no findings. The 9 advisory findings are follow-ups (below). T3 (RLS/migration) and the scaffold were never reviewed alone: the 9883-line range exceeded the lens context budget.
- Advisory follow-ups from review (non-blocking): approve/reject action ignores the update error and fails silently (R3/R4, `src/app/admin/clientes/actions.ts`); possible redirect loop with a revoked session (`src/lib/auth/access.ts:49-54`); pending page admin-gate behaviour (`src/app/cuenta/pendiente/page.tsx`); `actions.ts` untested; readability nits in `safe-next.ts`, `session.ts`, `schemas.ts`.

## Next step
T5 (CI) and T6 (design). Fix the approve/reject error handling first (small).
