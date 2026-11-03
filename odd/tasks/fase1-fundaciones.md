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
- [ ] T4 Auth + role shells: login, register (pending approval), middleware guards, `/admin` and `/tienda` placeholder layouts, tests
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

## Next step
Commit T3, then T4.
