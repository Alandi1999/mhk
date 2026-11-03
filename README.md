# MHK Moto Repuestos

Tienda mayorista online para talleres y locales de repuestos de motos. Stack: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui y Supabase. Ver `PRODUCT.md` para el contexto del producto.

## Requisitos

- Node.js 22 o superior
- pnpm
- Docker Desktop en ejecución (para Supabase local)

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env.local
pnpm db:start     # levanta Supabase local (la primera vez descarga imágenes Docker)
pnpm db:status    # muestra la URL y las claves locales
```

Copiá `API URL`, `anon key` y `service_role key` de `pnpm db:status` a `.env.local`. Después:

```bash
pnpm dev          # http://localhost:3000
```

## Scripts

| Script                                                 | Descripción                    |
| ------------------------------------------------------ | ------------------------------ |
| `pnpm dev`                                             | Servidor de desarrollo         |
| `pnpm build` / `pnpm start`                            | Build y servidor de producción |
| `pnpm lint`                                            | ESLint                         |
| `pnpm typecheck`                                       | TypeScript sin emitir          |
| `pnpm test`                                            | Tests con Vitest               |
| `pnpm format`                                          | Prettier                       |
| `pnpm db:start` / `db:stop` / `db:reset` / `db:status` | Supabase local                 |

## Base de datos (Supabase)

Migraciones en `supabase/migrations/`. Tabla `public.profiles` (1:1 con `auth.users`): `role` (`admin` | `cliente`), `status` (`pending` | `approved` | `rejected`), `razon_social`, `cuit` (11 dígitos, validado con dígito verificador AFIP/ARCA, único), `tax_condition`, `phone`.

- Al registrarse, un trigger crea el perfil siempre como `cliente` / `pending`; `role` y `status` enviados en la metadata del signup se ignoran. Un CUIT inválido hace fallar el registro.
- RLS: cada usuario ve y edita solo su perfil (no puede cambiar `role`, `status` ni `id`); los admins ven y editan todos. `anon` no accede a nada y nadie puede borrar perfiles.

Datos de desarrollo (`supabase/seed.sql`, **solo local**, se aplican con `pnpm db:reset`):

| Usuario              | Contraseña  | Rol / estado      |
| -------------------- | ----------- | ----------------- |
| `admin@mhk.local`    | `admin1234` | admin / approved  |
| `cliente1@mhk.local` | `admin1234` | cliente / pending |
| `cliente2@mhk.local` | `admin1234` | cliente / pending |

Tests de base de datos (pgTAP, requieren `pnpm db:start`): `pnpm db:test`. Tipos TypeScript: `pnpm db:types` (genera `src/lib/supabase/database.types.ts`).

## Autenticación y roles

- Rutas públicas: `/`, `/login`, `/registro`. `/cuenta/pendiente` muestra el estado de cuentas pendientes o rechazadas. `/tienda` requiere cliente aprobado (los admins aprobados también entran) y `/admin/**` requiere admin aprobado.
- La política vive en `src/lib/auth/access.ts` (función pura) y se aplica en `src/proxy.ts`. Como defensa en profundidad, los layouts de `/admin` y `/tienda` y las server actions de aprobación vuelven a validar con `requireProfile` (`src/lib/auth/session.ts`); la autoridad final sobre los datos es RLS.
- El parámetro `next` de `/login` solo acepta rutas relativas del mismo origen (`src/lib/auth/safe-next.ts`).
- Aprobación de clientes: `/admin/clientes` (filtro por estado, aprobar/rechazar).
- Supabase local tiene las confirmaciones de email desactivadas (`supabase/config.toml`, `enable_confirmations = false`): tras registrarse la sesión queda activa y el usuario va a `/cuenta/pendiente`. Con confirmaciones activadas (producción) el formulario muestra el estado "cuenta pendiente de aprobación" sin sesión.

## Variables de entorno

Ver `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` es solo de servidor y nunca debe exponerse al navegador. Las variables se validan con Zod en `src/lib/env.ts`.
