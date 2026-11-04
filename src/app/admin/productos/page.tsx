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
import { ProductList, type ProductRow } from "./product-list";

export const metadata: Metadata = { title: "Productos | MHK Moto Repuestos" };

const STATES = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
] as const;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/productos">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const q = one(params.q).slice(0, 100);
  const categoria = /^[0-9a-f-]{36}$/i.test(one(params.categoria))
    ? one(params.categoria)
    : "";
  const estado =
    STATES.find((s) => s.value === params.estado)?.value ?? "todos";
  const page = parsePage(params.page);

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("products")
    .select(
      "id, sku, name, brand, base_price, vat_rate, stock_on_hand, active, categories(name)",
      { count: "exact" },
    );
  for (const filter of searchFilters(q)) query = query.or(filter);
  if (categoria) query = query.eq("category_id", categoria);
  if (estado !== "todos") query = query.eq("active", estado === "activos");
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
    if (categoria) usp.set("categoria", categoria);
    if (estado !== "todos") usp.set("estado", estado);
    if (target > 1) usp.set("page", String(target));
    const s = usp.toString();
    return `/admin/productos${s ? `?${s}` : ""}`;
  };

  return (
    <PageContainer title="Productos">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          method="get"
          className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
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
            <Label htmlFor="categoria">Categoría</Label>
            <Select id="categoria" name="categoria" defaultValue={categoria}>
              <option value="">Todas</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select id="estado" name="estado" defaultValue={estado}>
              {STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
        <Link href="/admin/productos/nuevo" className={buttonVariants()}>
          Nuevo producto
        </Link>
      </div>

      {error && !outOfRange ? (
        <FormAlert>No pudimos cargar los productos. Probá de nuevo.</FormAlert>
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
          <ProductList
            products={products as unknown as ProductRow[]}
            caption="Productos"
          />
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
