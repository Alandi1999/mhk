import type { Metadata } from "next";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_PRODUCT, ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "Nuevo producto | MHK Moto Repuestos",
};

export default async function NewProductPage() {
  await requireProfile({ role: "admin" });
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <PageContainer
      title="Nuevo producto"
      description="Después de crearlo podés cargar compatibilidad y fotos."
      width="narrow"
    >
      <ProductForm initial={EMPTY_PRODUCT} categories={categories ?? []} />
    </PageContainer>
  );
}
