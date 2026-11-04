import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import { ActiveBadge } from "@/components/catalog/active-badge";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { serializeCompatibility } from "@/lib/catalog/compatibility";
import { IMAGE_BUCKET } from "@/lib/catalog/images";
import { createClient } from "@/lib/supabase/server";
import { CompatibilityEditor } from "../compatibility-editor";
import { ImageManager } from "../image-manager";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "Producto | MHK Moto Repuestos",
};

const IMAGE_ERRORS: Record<string, string> = {
  "imagen-vacia": "Elegí un archivo para subir.",
  "imagen-tipo": "Solo se aceptan imágenes JPG, PNG o WebP.",
  "imagen-peso": "La imagen supera el máximo de 5 MB.",
  "imagen-subida":
    "No se pudo subir la imagen. Puede que no tengas permiso. Probá de nuevo.",
  "imagen-borrar": "No se pudo eliminar la imagen. Probá de nuevo.",
};

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 border-t border-rule pt-6">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/productos/[id]">) {
  await requireProfile({ role: "admin" });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const imageError =
    typeof query.error === "string" ? IMAGE_ERRORS[query.error] : undefined;

  const supabase = await createClient();
  const [{ data: product }, { data: categories }, compat, images] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, sku, name, description, brand, category_id, base_price, vat_rate, stock_on_hand, active",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("categories").select("id, name").order("name"),
      supabase
        .from("product_compatibility")
        .select("moto_brand, moto_model, year_from, year_to")
        .eq("product_id", id)
        .order("moto_brand")
        .order("moto_model")
        .order("year_from", { nullsFirst: true }),
      supabase
        .from("product_images")
        .select("id, storage_path")
        .eq("product_id", id)
        .order("position"),
    ]);
  if (!product) notFound();

  const imageList = (images.data ?? []).map((image) => ({
    id: image.id,
    url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(image.storage_path)
      .data.publicUrl,
  }));

  return (
    <PageContainer title={product.name} width="narrow">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono font-semibold text-ink">{product.sku}</span>
        <ActiveBadge active={product.active} />
        <span className="text-sm text-ink-muted">
          Stock actual:{" "}
          <strong className="text-ink tabular-nums">
            {product.stock_on_hand}
          </strong>{" "}
          (se modifica desde movimientos de stock)
        </span>
      </div>

      {query.ok === "guardado" ? (
        <p role="status" className="text-sm font-semibold text-success">
          Producto guardado.
        </p>
      ) : null}

      <ProductForm
        initial={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description ?? "",
          brand: product.brand ?? "",
          category_id: product.category_id ?? "",
          price: String(product.base_price).replace(".", ","),
          vat: String(product.vat_rate),
          active: product.active,
        }}
        categories={categories ?? []}
      />

      <Section title="Compatibilidad">
        {compat.error ? (
          <FormAlert>No pudimos cargar la compatibilidad.</FormAlert>
        ) : (
          <CompatibilityEditor
            productId={product.id}
            initialText={serializeCompatibility(compat.data)}
          />
        )}
      </Section>

      <Section id="imagenes" title="Fotos">
        <FormAlert>{imageError}</FormAlert>
        <ImageManager productId={product.id} images={imageList} />
      </Section>
    </PageContainer>
  );
}
