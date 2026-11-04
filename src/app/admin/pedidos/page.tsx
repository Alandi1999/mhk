import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { CountBadge } from "@/components/shell/count-badge";
import { PageContainer } from "@/components/shell/page-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ORDER_FILTERS,
  isWorkQueue,
  orderSearchFilter,
  parseOrderFilter,
} from "@/lib/admin-orders/order-query";
import { requireProfile } from "@/lib/auth/session";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/catalog/product-query";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getPendingOrderCount } from "../pending-count";
import { OrderList, type OrderRow } from "./order-list";

export const metadata: Metadata = { title: "Pedidos | MHK Moto Repuestos" };

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/admin/pedidos">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const estado = parseOrderFilter(params.estado);
  const q = one(params.q).slice(0, 100);
  const page = parsePage(params.page);

  const supabase = await createClient();
  const pendingCount = await getPendingOrderCount();

  let query = supabase
    .from("orders")
    .select(
      "id, number, status, created_at, customer_razon_social, customer_cuit, total",
      { count: "exact" },
    );
  if (estado !== "all") query = query.eq("status", estado);
  const search = orderSearchFilter(q);
  if (search) query = query.or(search);
  const { from, to } = pageRange(page);
  // Work queue: the longest wait first. Everything else: newest first.
  const { data, count, error } = await query
    .order("created_at", { ascending: isWorkQueue(estado) })
    .order("number", { ascending: isWorkQueue(estado) })
    .range(from, to);

  // Asking for a page past the end is an empty page, not a failure.
  const outOfRange = error?.code === "PGRST103";
  const orders = (data ?? []) as OrderRow[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (opts: { estado?: string; page?: number }) => {
    const usp = new URLSearchParams();
    const e = opts.estado ?? estado;
    usp.set("estado", e);
    if (q) usp.set("q", q);
    if (opts.page && opts.page > 1) usp.set("page", String(opts.page));
    return `/admin/pedidos?${usp.toString()}`;
  };
  const estadoLabel =
    ORDER_FILTERS.find((f) => f.value === estado)?.label ?? "";

  return (
    <PageContainer title="Pedidos">
      <nav aria-label="Filtrar por estado" className="-mx-4 md:mx-0">
        <ul className="flex gap-1 overflow-x-auto border-b border-rule px-4 md:px-0">
          {ORDER_FILTERS.map((f) => {
            const active = f.value === estado;
            return (
              <li key={f.value} className="shrink-0">
                <Link
                  href={hrefFor({ estado: f.value })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {f.label}
                  {f.value === "pending" ? (
                    <CountBadge count={pendingCount} className="ml-2" />
                  ) : null}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1 bottom-0 h-1 bg-brand-orange slant-bar"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form
        method="get"
        className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <input type="hidden" name="estado" value={estado} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q">Buscar por número de pedido o cliente</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={100}
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {error && !outOfRange ? (
        <FormAlert>No pudimos cargar los pedidos. Probá de nuevo.</FormAlert>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          {page > 1 ? (
            <>
              No hay resultados en esta página.{" "}
              <Link href={hrefFor({})} className="underline">
                Volver a la primera
              </Link>
            </>
          ) : (
            "No hay pedidos con estos filtros."
          )}
        </p>
      ) : (
        <>
          <OrderList
            orders={orders}
            caption={`Pedidos: ${estadoLabel.toLowerCase()}`}
          />
          <nav
            aria-label="Paginación"
            className="flex items-center justify-between gap-3"
          >
            <p className="text-sm text-ink-muted tabular-nums">
              {total} {total === 1 ? "pedido" : "pedidos"} · página {page} de{" "}
              {pages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={hrefFor({ page: page - 1 })}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Anterior
                </Link>
              ) : null}
              {page < pages ? (
                <Link
                  href={hrefFor({ page: page + 1 })}
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
