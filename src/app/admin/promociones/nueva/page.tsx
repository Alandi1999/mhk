import type { Metadata } from "next";
import Link from "next/link";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PromotionForm } from "../promotion-form";

export const metadata: Metadata = {
  title: "Nueva promoción | MHK Moto Repuestos",
};

export default async function NewPromotionPage() {
  await requireProfile({ role: "admin" });
  const supabase = await createClient();
  const [categories, priceLists] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("price_lists").select("id, name").order("name"),
  ]);

  return (
    <PageContainer title="Nueva promoción" width="narrow">
      <Link
        href="/admin/promociones"
        className="-mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
      >
        Volver a promociones
      </Link>
      <FormAlert>
        {categories.error || priceLists.error
          ? "No pudimos cargar las categorías o las listas. Recargá la página."
          : null}
      </FormAlert>
      <PromotionForm
        categories={categories.data ?? []}
        priceLists={priceLists.data ?? []}
        initial={{
          name: "",
          discount: "",
          min_qty: "1",
          target: "all",
          sku: "",
          category_id: "",
          price_list_id: "",
          starts_at: "",
          ends_at: "",
        }}
      />
    </PageContainer>
  );
}
