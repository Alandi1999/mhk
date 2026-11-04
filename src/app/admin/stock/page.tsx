import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireProfile } from "@/lib/auth/session";
import {
  PAGE_SIZE,
  pageRange,
  parsePage,
  searchFilters,
} from "@/lib/catalog/product-query";
import { createClient } from "@/lib/supabase/server";
import { StockList, type StockRow } from "./stock-list";

export const metadata: Metadata = { title: "Stock | MHK Moto Repuestos" };

const LEVELS = [
  { value: "todos", label: "Todos" },
  { value: "sin-stock", label: "Sin stock" },
] as const;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function StockPage({
  searchParams,
}: PageProps<"/admin/stock">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const q = one(params.q).slice(0, 100);
  const nivel = LEVELS.find((l) => l.value === params.nivel)?.value ?? "todos";
  const page = parsePage(params.page);

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, sku, name, brand, stock_on_hand, active", { count: "exact" });
  for (const filter of searchFilters(q)) query = query.or(filter);
  if (nivel === "sin-stock") query = query.eq("stock_on_hand", 0);
  const { from, to } = pageRange(page);
  const {
    data: products,
    count,
    error,
  } = await query.order("sku").range(from, to);

  // Asking for a page past the end is an empty page, not a failure.
  const outOfRange = error?.code === "PGRST103";
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (target: number) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (nivel !== "todos") usp.set("nivel", nivel);
    if (target > 1) usp.set("page", String(target));
    const s = usp.toString();
    return `/admin/stock${s ? `?${s}` : ""}`;
  };

  return (
    <PageContainer
      title="Stock"
      description="El stock cambia solo con movimientos: cada ingreso, ajuste o devolución queda registrado."
    >
      <form
        method="get"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] lg:items-end"
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="q">Buscar por SKU o nombre</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nivel">Mostrar</Label>
          <Select id="nivel" name="nivel" defaultValue={nivel}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {error && !outOfRange ? (
        <FormAlert>No pudimos cargar el stock. Probá de nuevo.</FormAlert>
      ) : !products || products.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          {page > 1 ? (
            <>
              No hay resultados en esta página.{" "}
              <Link href={hrefFor(1)} className="underline">
                Volver a la primera
              </Link>
            </>
          ) : (
            "No hay productos con estos filtros."
          )}
        </p>
      ) : (
        <>
          <StockList products={products as StockRow[]} caption="Stock" />
          <nav
            aria-label="Paginación"
            className="flex items-center justify-between gap-3"
          >
            <p className="text-sm text-ink-muted tabular-nums">
              {total} {total === 1 ? "producto" : "productos"} · página {page}{" "}
              de {pages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={hrefFor(page - 1)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Anterior
                </Link>
              ) : null}
              {page < pages ? (
                <Link
                  href={hrefFor(page + 1)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Siguiente
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
    </PageContainer>
  );
}
