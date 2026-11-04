import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import { RuleStateBadge } from "@/components/promotions/rule-state-badge";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { isoToLocalInput } from "@/lib/promotions/schemas";
import { promotionState } from "@/lib/promotions/state";
import { createClient } from "@/lib/supabase/server";
import { deletePromotion } from "../actions";
import { PromotionForm } from "../promotion-form";

export const metadata: Metadata = {
  title: "Editar promoción | MHK Moto Repuestos",
};

export default async function EditPromotionPage({
  params,
}: PageProps<"/admin/promociones/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [promotion, categories, priceLists] = await Promise.all([
    supabase
      .from("promotions")
      .select("*, products(sku)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("price_lists").select("id, name").order("name"),
  ]);
  const p = promotion.data;
  if (!p) notFound();

  const target = p.products ? "product" : p.category_id ? "category" : "all";

  return (
    <PageContainer title={p.name} width="narrow">
      <Link
        href="/admin/promociones"
        className="-mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
      >
        Volver a promociones
      </Link>
      <div>
        <RuleStateBadge
          state={promotionState(p, new Date())}
          kind="promotion"
        />
      </div>
      <FormAlert>
        {categories.error || priceLists.error
          ? "No pudimos cargar las categorías o las listas. Recargá la página."
          : null}
      </FormAlert>
      <PromotionForm
        id={p.id}
        categories={categories.data ?? []}
        priceLists={priceLists.data ?? []}
        initial={{
          name: p.name,
          discount: String(p.discount_pct).replace(".", ","),
          min_qty: String(p.min_qty),
          target,
          sku: p.products?.sku ?? "",
          category_id: p.category_id ?? "",
          price_list_id: p.price_list_id ?? "",
          starts_at: isoToLocalInput(p.starts_at),
          ends_at: isoToLocalInput(p.ends_at),
        }}
      />

      <section className="flex flex-col gap-3 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Eliminar</h2>
        <details className="group rounded-lg border border-rule bg-surface">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-ink">
            Quiero eliminar esta promoción
          </summary>
          <form
            action={deletePromotion}
            className="flex flex-col gap-3 border-t border-rule p-4"
          >
            <input type="hidden" name="id" value={p.id} />
            <p className="text-sm text-ink-muted">
              Se elimina para siempre y deja de aplicarse en los precios. Los
              pedidos ya hechos no cambian. Si solo querés pausarla, desactivala
              desde la lista.
            </p>
            <div>
              <Button
                type="submit"
                variant="destructive"
                className="max-sm:w-full"
              >
                Eliminar promoción
              </Button>
            </div>
          </form>
        </details>
      </section>
    </PageContainer>
  );
}
