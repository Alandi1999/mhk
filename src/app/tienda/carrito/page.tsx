import { TriangleAlert, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth/session";
import { formatArs } from "@/lib/catalog/money";
import {
  buildCartLines,
  cartSummary,
  noticeMessage,
  type CartIssue,
  type CartLine,
} from "@/lib/cart/cart";
import { cartTotals } from "@/lib/orders/orders";
import { createClient } from "@/lib/supabase/server";
import { placeOrder, removeFromCart, setCartQuantity } from "./actions";

export const metadata: Metadata = { title: "Carrito | MHK Moto Repuestos" };

const ISSUE_TEXT: Record<CartIssue, string> = {
  unavailable: "Este repuesto ya no está disponible. Quitalo para poder pedir.",
  "no-stock": "Sin stock. Quitalo o esperá a que vuelva a haber.",
  "no-price": "Sin precio publicado. Consultanos antes de pedirlo.",
};

function lineNet(line: CartLine): number | null {
  if (line.price === null) return null;
  return cartTotals([
    { price: line.price, quantity: line.quantity, vatRate: line.vatRate },
  ]).subtotalNet;
}

function QuantityForm({ line }: { line: CartLine }) {
  if (line.issue === "unavailable") return null;
  const id = `qty-${line.productId}`;
  return (
    <form action={setCartQuantity} className="flex items-end gap-2">
      <input type="hidden" name="product_id" value={line.productId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id} className="text-sm text-ink-muted">
          Cantidad<span className="sr-only"> de {line.sku}</span>
        </Label>
        <Input
          id={id}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={9999}
          step={1}
          defaultValue={line.quantity}
          required
          className="w-20 tabular-nums"
        />
      </div>
      <Button type="submit" variant="outline">
        Actualizar
      </Button>
    </form>
  );
}

function RemoveForm({ line }: { line: CartLine }) {
  return (
    <form action={removeFromCart}>
      <input type="hidden" name="product_id" value={line.productId} />
      <Button type="submit" variant="ghost">
        <Trash2 aria-hidden="true" />
        Quitar<span className="sr-only"> {line.sku ?? "producto"}</span>
      </Button>
    </form>
  );
}

function Issue({ line }: { line: CartLine }) {
  if (!line.issue) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm font-medium text-danger-strong">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {ISSUE_TEXT[line.issue]}
    </p>
  );
}

function LineTitle({ line }: { line: CartLine }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="font-mono text-lg font-bold text-ink">
        {line.sku ?? "Repuesto no disponible"}
      </p>
      {line.name ? <p className="text-base text-ink">{line.name}</p> : null}
      <Issue line={line} />
    </div>
  );
}

export default async function CartPage({
  searchParams,
}: PageProps<"/tienda/carrito">) {
  await requireProfile({ role: "cliente" });
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const [cart, settings] = await Promise.all([
    supabase
      .from("cart_items")
      .select("product_id, quantity")
      .order("updated_at", { ascending: false }),
    supabase.from("settings").select("min_order_net").maybeSingle(),
  ]);
  const cartRows = cart.data ?? [];
  const { data: catalog } =
    cartRows.length > 0
      ? await supabase
          .from("catalog_products")
          .select("id, sku, name, price, vat_rate, in_stock")
          .in(
            "id",
            cartRows.map((r) => r.product_id),
          )
      : { data: [] };

  const minOrder = settings.data?.min_order_net ?? 0;
  const lines = buildCartLines(cartRows, catalog ?? []);
  const summary = cartSummary(lines, minOrder);
  const loadFailed = !!cart.error;

  return (
    <PageContainer
      title="Carrito"
      description="Revisá las cantidades y confirmá tu pedido. Los precios son netos de IVA."
    >
      {errorCode ? <FormAlert>{noticeMessage(errorCode)}</FormAlert> : null}

      {loadFailed ? (
        <FormAlert>No pudimos cargar tu carrito. Probá de nuevo.</FormAlert>
      ) : lines.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-rule bg-surface px-4 py-10">
          <p className="text-ink">Tu carrito está vacío.</p>
          <Link href="/tienda" className={buttonVariants()}>
            Buscar repuestos
          </Link>
        </div>
      ) : (
        <>
          {/* Stacked rows below lg, table from lg. */}
          <ul
            aria-label="Productos del carrito"
            className="flex flex-col gap-3 lg:hidden"
          >
            {lines.map((line) => {
              const net = lineNet(line);
              return (
                <li
                  key={line.productId}
                  className="flex flex-col gap-3 rounded-lg border border-rule bg-surface p-3"
                >
                  <LineTitle line={line} />
                  {net !== null && line.price !== null ? (
                    <p className="text-sm text-ink-muted tabular-nums">
                      {formatArs(line.price)} c/u ·{" "}
                      <span className="font-bold text-ink">
                        {formatArs(net)}
                      </span>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <QuantityForm line={line} />
                    <RemoveForm line={line} />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-hidden rounded-lg border border-rule bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Productos del carrito</caption>
              <thead className="bg-surface-2 text-ink-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Repuesto
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-semibold"
                  >
                    Precio neto
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Cantidad
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-semibold"
                  >
                    Subtotal neto
                  </th>
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">Quitar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const net = lineNet(line);
                  return (
                    <tr
                      key={line.productId}
                      className="border-t border-rule align-top"
                    >
                      <td className="px-3 py-3">
                        <LineTitle line={line} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {line.price !== null ? formatArs(line.price) : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <QuantityForm line={line} />
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-ink tabular-nums">
                        {net !== null ? formatArs(net) : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <RemoveForm line={line} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section
            aria-label="Resumen del pedido"
            className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4 lg:ml-auto lg:w-96"
          >
            <dl className="flex flex-col gap-1 text-sm tabular-nums">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Subtotal neto</dt>
                <dd className="text-ink">
                  {formatArs(summary.totals.subtotalNet)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">IVA</dt>
                <dd className="text-ink">
                  {formatArs(summary.totals.vatTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-rule pt-2 text-lg font-bold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink">{formatArs(summary.totals.total)}</dd>
              </div>
            </dl>

            {summary.missingToMinimum > 0 ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2.5 text-sm font-medium text-warning"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>
                  Te faltan {formatArs(summary.missingToMinimum)} para el mínimo
                  de compra ({formatArs(minOrder)} netos).
                </span>
              </p>
            ) : null}
            {summary.hasIssues ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2.5 text-sm font-medium text-warning"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>
                  Resolvé los avisos de arriba para poder confirmar el pedido.
                </span>
              </p>
            ) : null}

            <form action={placeOrder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note">Nota para el pedido (opcional)</Label>
                <Textarea
                  id="note"
                  name="note"
                  maxLength={500}
                  rows={3}
                  placeholder="Ej.: retiro por el local, entregar por la tarde"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!summary.canCheckout}
                className="w-full"
              >
                Confirmar pedido
              </Button>
            </form>
          </section>
        </>
      )}
    </PageContainer>
  );
}
