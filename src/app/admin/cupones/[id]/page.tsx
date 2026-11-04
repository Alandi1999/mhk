import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RuleStateBadge } from "@/components/promotions/rule-state-badge";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { isoToLocalInput } from "@/lib/promotions/schemas";
import { couponState } from "@/lib/promotions/state";
import { createClient } from "@/lib/supabase/server";
import { deleteCoupon } from "../actions";
import { CouponForm } from "../coupon-form";

export const metadata: Metadata = {
  title: "Editar cupón | MHK Moto Repuestos",
};

export default async function EditCouponPage({
  params,
}: PageProps<"/admin/cupones/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: c } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  return (
    <PageContainer title={c.code} width="narrow">
      <Link
        href="/admin/cupones"
        className="-mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
      >
        Volver a cupones
      </Link>
      <div>
        <RuleStateBadge state={couponState(c, new Date())} kind="coupon" />
      </div>
      <CouponForm
        id={c.id}
        uses={c.uses}
        initial={{
          code: c.code,
          discount: String(c.discount_pct).replace(".", ","),
          min_order:
            c.min_order_net > 0
              ? String(c.min_order_net).replace(".", ",")
              : "",
          max_uses: c.max_uses === null ? "" : String(c.max_uses),
          starts_at: isoToLocalInput(c.starts_at),
          ends_at: isoToLocalInput(c.ends_at),
        }}
      />

      <section className="flex flex-col gap-3 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Eliminar</h2>
        {c.uses > 0 ? (
          <p className="max-w-[65ch] text-sm text-ink-muted">
            Este cupón ya se usó en {c.uses}{" "}
            {c.uses === 1 ? "pedido" : "pedidos"}, así que no se puede eliminar.
            Desactivalo desde la lista para que deje de aceptarse.
          </p>
        ) : (
          <details className="rounded-lg border border-rule bg-surface">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-ink">
              Quiero eliminar este cupón
            </summary>
            <form
              action={deleteCoupon}
              className="flex flex-col gap-3 border-t border-rule p-4"
            >
              <input type="hidden" name="id" value={c.id} />
              <p className="text-sm text-ink-muted">
                Se elimina para siempre. Como nadie lo usó, no afecta a ningún
                pedido. Si solo querés pausarlo, desactivalo desde la lista.
              </p>
              <div>
                <Button
                  type="submit"
                  variant="destructive"
                  className="max-sm:w-full"
                >
                  Eliminar cupón
                </Button>
              </div>
            </form>
          </details>
        )}
      </section>
    </PageContainer>
  );
}
