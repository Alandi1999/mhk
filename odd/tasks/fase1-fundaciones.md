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
- [x] T5 CI: GitHub Actions (lint, typecheck, unit tests, supabase db tests) — `.github/workflows/ci.yml`: job `app` (format:check, lint, typecheck, test, build with placeholder env) and job `database` (db:start, db:reset, db:test). Prettier-clean; NOT yet run on GitHub (needs a pushed repo). Risk: item 5 (CI).
- [x] T6 Design tokens: `DESIGN.md` + Tailwind tokens from `public/mhk logo.png` via impeccable, applied to login and shells (commits ddfdaf0, 1cad58f, 2242677; finish review: fix round then verdict ship over the 8 scored fixes; DESIGN.md + .impeccable/design.json written; known drift recorded in DESIGN.md: orange tab marker 2.47:1 on the light ground; minor: registro reserved alert slot ~100px gap, truncated admin email on mobile)

## Route per task
Recorded as tasks start (inline vs delegated, with trigger evidence).
- T1+T2: delegated direct, one writer (writer trigger: 2+ non-trivial files, scaffolding + dependency installs).
- T6: delegated direct writer (trigger: 2+ non-trivial files, ~30 files touched).

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

- T6 implementation (commit pending, parent commits): tokens in `src/app/globals.css`, Archivo (wdth axis) + Geist Mono, shell components in `src/components/shell/`, restyled ui/button|input|label + new select, auth shell for /, /login, /registro, /cuenta/pendiente, branded headers for /admin and /tienda, responsive clients table (table from lg, stacked rows below). Styling exempt from RED/GREEN; status badge test written first (RED: unresolved import, then GREEN), button loading test added. Checks: lint, typecheck, format:check, build ok; 94 tests pass. Detector: no findings. Screenshots in `.impeccable/review/` (login, login-errors, registro, registro-errors, admin, admin-clientes, admin-clientes-aprobados, tienda, cuenta-pendiente; desktop+mobile; zero horizontal overflow measured). Pending: finish review, DESIGN.md.
- Seed note: seeded users have non-RFC4122 UUIDs, so `z.uuid()` in the approve action rejects them (`error=invalido`); real signups work.

- T6 finish-review fix batch (delegated direct writer, same trigger; commit pending, parent commits UI fix and seed fix separately): pending count (head-only count query, `src/app/admin/pending-count.ts`, `CountBadge` with accessible name "N pendientes" in nav, tab and /admin row), pending tab oldest first with "Esperando" column (`formatWait`, `src/lib/format/relative-wait.ts`) and `formatCuit` (RED observed: 3 failed + unresolved import, then GREEN, 111 tests), Rechazar spacing (gap-4 mobile), reserved FormAlert slot (`reserve`, min-h-15) above submit, /admin rows full container width, text-xs removed from functional text (table head label stays 12px), eyebrow chip/bar removed, tienda mobile lone nav hidden and user identity shown truncated. Seed UUIDs replaced with v4-shaped ids; `pnpm db:reset` ok, `pnpm db:test` 24/24, seeded cliente1 approved from admin UI (then logged into /tienda). Button top offset (px) no error vs error, identical in all cases: login desktop 575.3/575.3, mobile 448.5/448.5; registro desktop 902.3/902.3, mobile 1095.5/1095.5 (field errors and form-level alert both measured). Checks: lint, typecheck, test (111), build, format:check ok; detector: no findings. Screenshots from `pnpm build && pnpm start` (no dev badge).

## Next step
T5 (CI) and T6 (design). Fix the approve/reject error handling first (small).
