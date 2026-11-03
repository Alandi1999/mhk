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

## Variables de entorno

Ver `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` es solo de servidor y nunca debe exponerse al navegador. Las variables se validan con Zod en `src/lib/env.ts`.
