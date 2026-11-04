import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { formatArs } from "@/lib/catalog/money";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/catalog/product-query";
import { effectivePrice } from "@/lib/pricing/effective-price";
import { createClient } from "@/lib/supabase/server";
import { removeItem } from "../actions";
import { ItemForm, ItemsImportForm } from "../item-forms";
import { ListForm } from "../list-form";
import { formatPct } from "../list-table";

export const metadata: Metadata = {
  title: "Lista de precios | MHK Moto Repuestos",
};

const ACTION_ERRORS: Record<string, string> = {
  quitar: "No se pudo quitar el precio. Recargá e intentá de nuevo.",
};

const OK_MESSAGES: Record<string, string> = {
  creada: "Lista creada.",
  guardada: "Lista guardada.",
  quitado: "Precio puntual quitado.",
};

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-6">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

type Item = {
  productId: string;
  sku: string;
  name: string;
  base: number;
  listPrice: number;
  explicit: number;
};

function RemoveButton({ listId, item }: { listId: string; item: Item }) {
  return (
    <form action={removeItem}>
      <input type="hidden" name="list_id" value={listId} />
      <input type="hidden" name="product_id" value={item.productId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        aria-label={`Quitar el precio puntual de ${item.sku}`}
      >
        Quitar
      </Button>
    </form>
  );
}

export default async function PriceListPage({
  params,
  searchParams,
}: PageProps<"/admin/listas-de-precios/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const page = parsePage(query.page);
  const actionError =
    typeof query.error === "string" ? ACTION_ERRORS[query.error] : undefined;
  const ok = typeof query.ok === "string" ? OK_MESSAGES[query.ok] : undefined;

  const supabase = await createClient();
  const { from, to } = pageRange(page);
  const [{ data: list }, itemsResult, clients] = await Promise.all([
    supabase
      .from("price_lists")
      .select("id, name, discount_pct")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("price_list_items")
      .select("product_id, price, products!inner(sku, name, base_price)", {
        count: "exact",
      })
      .eq("price_list_id", id)
      .order("products(sku)")
      .range(from, to),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("price_list_id", id),
  ]);
  if (!list) notFound();

  const outOfRange = itemsResult.error?.code === "PGRST103";
  const total = itemsResult.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items: Item[] = (itemsResult.data ?? [])
    .map((row) => ({
      productId: row.product_id,
      sku: row.products.sku,
      name: row.products.name,
      base: row.products.base_price,
      listPrice: effectivePrice({
        basePrice: row.products.base_price,
        discountPct: list.discount_pct,
        explicitPrice: null,
      }),
      explicit: row.price,
    }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
  const hrefFor = (target: number) =>
    `/admin/listas-de-precios/${id}${target > 1 ? `?page=${target}` : ""}`;

  return (
    <PageContainer title={list.name}>
      <p className="text-sm text-ink-muted">
        <Link href="/admin/listas-de-precios" className="underline">
          Volver a las listas
        </Link>
        {" · "}
        {formatPct(list.discount_pct)} de descuento ·{" "}
        <span className="tabular-nums">{clients.count ?? 0}</span> clientes con
        esta lista
      </p>
      {ok ? (
        <p role="status" className="text-sm font-semibold text-success">
          {ok}
        </p>
      ) : null}
      <FormAlert>{actionError}</FormAlert>

      <ListForm
        initial={{
          id: list.id,
          name: list.name,
          discount: String(list.discount_pct).replace(".", ","),
        }}
      />

      <Section title="Precios puntuales">
        <p className="max-w-[65ch] text-sm text-ink-muted">
          Un precio puntual (neto, sin IVA) reemplaza al descuento de la lista
          para ese producto.
        </p>
        {itemsResult.error && !outOfRange ? (
          <FormAlert>No pudimos cargar los precios. Probá de nuevo.</FormAlert>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
            {page > 1 ? (
              <>
                No hay resultados en esta página.{" "}
                <Link href={hrefFor(1)} className="underline">
                  Volver a la primera
                </Link>
              </>
            ) : (
              "Esta lista no tiene precios puntuales."
            )}
          </p>
        ) : (
          <>
            <div className="hidden rounded-lg border border-rule bg-surface lg:block">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <caption className="sr-only">Precios puntuales</caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${th} rounded-tl-lg`}>
                      SKU
                    </th>
                    <th scope="col" className={th}>
                      Producto
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Precio base
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Con el % de la lista
                    </th>
                    <th scope="col" className={`${th} text-right`}>
                      Precio puntual
                    </th>
                    <th
                      scope="col"
                      className={`${th} rounded-tr-lg text-right`}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
                  {items.map((i) => (
                    <tr key={i.productId}>
                      <td className={`${td} font-mono whitespace-nowrap`}>
                        {i.sku}
                      </td>
                      <td className={`${td} font-semibold text-ink`}>
                        {i.name}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        {formatArs(i.base)}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>
                        {formatArs(i.listPrice)}
                      </td>
                      <td
                        className={`${td} text-right font-semibold text-ink tabular-nums`}
                      >
                        {formatArs(i.explicit)}
                      </td>
                      <td className={`${td} text-right`}>
                        <RemoveButton listId={list.id} item={i} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
              {items.map((i) => (
                <li key={i.productId} className="flex flex-col gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-semibold text-ink">
                      {i.sku}
                    </span>
                    <span className="font-semibold break-words text-ink">
                      {i.name}
                    </span>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-ink-muted">Precio base</dt>
                    <dd className="tabular-nums">{formatArs(i.base)}</dd>
                    <dt className="text-ink-muted">Con el % de la lista</dt>
                    <dd className="tabular-nums">{formatArs(i.listPrice)}</dd>
                    <dt className="text-ink-muted">Precio puntual</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {formatArs(i.explicit)}
                    </dd>
                  </dl>
                  <RemoveButton listId={list.id} item={i} />
                </li>
              ))}
            </ul>

            {pages > 1 ? (
              <nav
                aria-label="Paginación"
                className="flex items-center justify-between gap-3 text-sm"
              >
                {page > 1 ? (
                  <Link
                    href={hrefFor(page - 1)}
                    className="inline-flex min-h-11 items-center font-semibold underline"
                  >
                    Anterior
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-ink-muted tabular-nums">
                  Página {page} de {pages}
                </span>
                {page < pages ? (
                  <Link
                    href={hrefFor(page + 1)}
                    className="inline-flex min-h-11 items-center font-semibold underline"
                  >
                    Siguiente
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </Section>

      <Section title="Agregar o actualizar un precio">
        <ItemForm listId={list.id} />
      </Section>

      <Section title="Importar precios desde CSV">
        <p>
          <a
            href="/admin/listas-de-precios/plantilla-precios.csv"
            download
            className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
          >
            Descargar plantilla de precios
          </a>
        </p>
        <ItemsImportForm listId={list.id} />
      </Section>
    </PageContainer>
  );
}
