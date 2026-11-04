import { CircleCheck, TriangleAlert, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { PromoBadge } from "@/components/store/promo-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth/session";
import { formatArs } from "@/lib/catalog/money";
import { noticeMessage } from "@/lib/cart/cart";
import {
  couponNotice,
  isDiscounted,
  lineIssue,
  normalizeCoupon,
  parseQuote,
  quoteSummary,
  type CartIssue,
  type QuoteLine,
} from "@/lib/cart/quote";
import { createClient } from "@/lib/supabase/server";
import { placeOrder, removeFromCart, setCartQuantity } from "./actions";

export const metadata: Metadata = { title: "Carrito | MHK Moto Repuestos" };

const ISSUE_TEXT: Record<CartIssue, string> = {
  unavailable: "Este repuesto ya no está disponible. Quitalo para poder pedir.",
  "no-stock": "Sin stock. Quitalo o esperá a que vuelva a haber.",
};

type Line = QuoteLine & { issue: CartIssue | null };

function CouponField({ coupon }: { coupon: string | null }) {
  return coupon ? <input type="hidden" name="cupon" value={coupon} /> : null;
}

function QuantityForm({ line, coupon }: { line: Line; coupon: string | null }) {
  if (line.issue === "unavailable") return null;
  const id = `qty-${line.product_id}`;
  return (
    <form action={setCartQuantity} className="flex items-end gap-2">
      <input type="hidden" name="product_id" value={line.product_id} />
      <CouponField coupon={coupon} />
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

function RemoveForm({ line, coupon }: { line: Line; coupon: string | null }) {
  return (
    <form action={removeFromCart}>
      <input type="hidden" name="product_id" value={line.product_id} />
      <CouponField coupon={coupon} />
      <Button type="submit" variant="ghost">
        <Trash2 aria-hidden="true" />
        Quitar<span className="sr-only"> {line.sku}</span>
      </Button>
    </form>
  );
}

function Issue({ line }: { line: Line }) {
  if (!line.issue) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm font-medium text-danger-strong">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {ISSUE_TEXT[line.issue]}
    </p>
  );
}

function LineTitle({ line }: { line: Line }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="font-mono text-lg font-bold text-ink">{line.sku}</p>
      <p className="text-base text-ink">{line.name}</p>
      <Issue line={line} />
    </div>
  );
}

/** Unit price, with the list price struck through and the rule when one won. */
function UnitPrice({ line, align }: { line: Line; align: "left" | "right" }) {
  const discounted = isDiscounted(line.unit_price, line.list_price);
  return (
    <div
      className={
        align === "right"
          ? "flex flex-col items-end gap-1"
          : "flex flex-col items-start gap-1"
      }
    >
      {discounted && line.list_price !== null ? (
        <s className="text-sm text-ink-muted tabular-nums">
          <span className="sr-only">Precio de lista: </span>
          {formatArs(line.list_price)}
        </s>
      ) : null}
      <span className="tabular-nums">{formatArs(line.unit_price)}</span>
      {discounted && line.rule_name ? (
        <PromoBadge name={line.rule_name} />
      ) : null}
    </div>
  );
}

function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2.5 text-sm font-medium text-warning"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export default async function CartPage({
  searchParams,
}: PageProps<"/tienda/carrito">) {
  await requireProfile({ role: "cliente" });
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const coupon = normalizeCoupon(params.cupon);

  const supabase = await createClient();
  const [quoteRes, settings] = await Promise.all([
    supabase.rpc("cart_quote", { p_coupon: coupon ?? undefined }),
    supabase.from("settings").select("min_order_net").maybeSingle(),
  ]);
  const quote = quoteRes.error ? null : parseQuote(quoteRes.data);
  const minOrder = settings.data?.min_order_net ?? 0;

  // Stock is only exposed to clients as a flag, through the catalog view.
  const { data: catalog } =
    quote && quote.lines.length > 0
      ? await supabase
          .from("catalog_products")
          .select("id, in_stock")
          .in(
            "id",
            quote.lines.map((l) => l.product_id),
          )
      : { data: [] };
  const stockById = new Map((catalog ?? []).map((p) => [p.id, p.in_stock]));
  const lines: Line[] = (quote?.lines ?? []).map((l) => ({
    ...l,
    issue: lineIssue(l, stockById.get(l.product_id) ?? undefined),
  }));
  const hasIssues = lines.some((l) => l.issue !== null);
  const summary = quote ? quoteSummary(quote, hasIssues, minOrder) : null;
  const notice = quote ? couponNotice(quote.coupon) : { kind: "none" as const };

  return (
    <PageContainer
      title="Carrito"
      description="Revisá las cantidades y confirmá tu pedido. Los precios son netos de IVA."
    >
      {errorCode ? <FormAlert>{noticeMessage(errorCode)}</FormAlert> : null}

      {!quote || !summary ? (
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
            {lines.map((line) => (
              <li
                key={line.product_id}
                className="flex flex-col gap-3 rounded-lg border border-rule bg-surface p-3"
              >
                <LineTitle line={line} />
                <div className="flex flex-col gap-1 text-sm text-ink-muted">
                  <UnitPrice line={line} align="left" />
                  <p className="tabular-nums">
                    {line.quantity} u. ·{" "}
                    <span className="font-bold text-ink">
                      {formatArs(line.line_net)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <QuantityForm line={line} coupon={coupon} />
                  <RemoveForm line={line} coupon={coupon} />
                </div>
              </li>
            ))}
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
                {lines.map((line) => (
                  <tr
                    key={line.product_id}
                    className="border-t border-rule align-top"
                  >
                    <td className="px-3 py-3">
                      <LineTitle line={line} />
                    </td>
                    <td className="px-3 py-3">
                      <UnitPrice line={line} align="right" />
                    </td>
                    <td className="px-3 py-3">
                      <QuantityForm line={line} coupon={coupon} />
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-ink tabular-nums">
                      {formatArs(line.line_net)}
                    </td>
                    <td className="px-3 py-3">
                      <RemoveForm line={line} coupon={coupon} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section
            aria-label="Resumen del pedido"
            className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4 lg:ml-auto lg:w-96"
          >
            <form method="get" className="flex flex-col gap-2">
              <Label htmlFor="cupon">Cupón de descuento</Label>
              <div className="flex gap-2">
                <Input
                  id="cupon"
                  name="cupon"
                  defaultValue={coupon ?? ""}
                  maxLength={30}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="min-w-0 flex-1 font-mono uppercase"
                />
                <Button type="submit" variant="outline">
                  Aplicar
                </Button>
              </div>
              {notice.kind === "applied" ? (
                <p
                  role="status"
                  className="flex items-start gap-2 rounded-md bg-success-tint px-3 py-2 text-sm font-medium text-success"
                >
                  <CircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {notice.text}
                </p>
              ) : null}
              {notice.kind === "error" ? (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 text-sm font-medium text-danger-strong"
                >
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {notice.text}
                </p>
              ) : null}
              {coupon ? (
                <Link
                  href="/tienda/carrito"
                  className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
                >
                  Quitar cupón
                </Link>
              ) : null}
            </form>

            <dl className="flex flex-col gap-1 text-sm tabular-nums">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="text-ink">{formatArs(quote.gross_net)}</dd>
              </div>
              {quote.discount_net > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Descuento cupón</dt>
                  <dd className="text-ink">-{formatArs(quote.discount_net)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">IVA</dt>
                <dd className="text-ink">{formatArs(quote.vat_total)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-rule pt-2 text-lg font-bold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink">{formatArs(quote.total)}</dd>
              </div>
            </dl>

            {summary.missingToMinimum > 0 ? (
              <WarningNote>
                Te faltan {formatArs(summary.missingToMinimum)} para el mínimo
                de compra ({formatArs(minOrder)} netos).
              </WarningNote>
            ) : null}
            {hasIssues ? (
              <WarningNote>
                Resolvé los avisos de arriba para poder confirmar el pedido.
              </WarningNote>
            ) : null}
            {notice.kind === "error" ? (
              <WarningNote>
                Corregí o quitá el cupón para poder confirmar el pedido.
              </WarningNote>
            ) : null}

            <form action={placeOrder} className="flex flex-col gap-4">
              <CouponField coupon={coupon} />
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
