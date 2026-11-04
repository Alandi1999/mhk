import { ArrowLeft, ImageOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { AvailabilityBadge } from "@/components/store/availability-badge";
import { PriceBlock } from "@/components/store/price-block";
import { requireProfile } from "@/lib/auth/session";
import { IMAGE_BUCKET } from "@/lib/catalog/images";
import { isValidSku, normalizeSku } from "@/lib/catalog/sku";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Repuesto | MHK Moto Repuestos" };

function years(from: number | null, to: number | null): string {
  if (from && to) return from === to ? String(from) : `${from} a ${to}`;
  if (from) return `Desde ${from}`;
  if (to) return `Hasta ${to}`;
  return "Todos";
}

export default async function StoreProductPage({
  params,
}: PageProps<"/tienda/producto/[sku]">) {
  await requireProfile({ role: "cliente" });
  const { sku: rawSku } = await params;
  const sku = normalizeSku(decodeURIComponent(rawSku));
  if (!isValidSku(sku)) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("catalog_products")
    .select(
      "id, sku, name, description, brand, category_id, base_price, vat_rate, in_stock",
    )
    .eq("sku", sku)
    .maybeSingle();
  if (!product) notFound();

  const [category, compat, images] = await Promise.all([
    product.category_id
      ? supabase
          .from("categories")
          .select("name")
          .eq("id", product.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("product_compatibility")
      .select("moto_brand, moto_model, year_from, year_to")
      .eq("product_id", product.id)
      .order("moto_brand")
      .order("moto_model")
      .order("year_from", { nullsFirst: true }),
    supabase
      .from("product_images")
      .select("id, storage_path")
      .eq("product_id", product.id)
      .order("position"),
  ]);
  const imageUrls = (images.data ?? []).map((image) => ({
    id: image.id,
    url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(image.storage_path)
      .data.publicUrl,
  }));

  return (
    <PageContainer title={product.name}>
      <Link
        href="/tienda"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al catálogo
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
        <div className="flex flex-col gap-3">
          {imageUrls.length === 0 ? (
            <div className="flex aspect-video items-center justify-center gap-2 rounded-lg bg-surface-2 text-ink-muted">
              <ImageOff aria-hidden="true" className="size-5" />
              <span className="text-sm">Sin fotos</span>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {imageUrls.map((image) => (
                <li key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`${product.name}, foto`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg border border-rule bg-surface-2 object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <section
          aria-label="Datos del repuesto"
          className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4"
        >
          <p className="font-mono text-2xl font-bold text-ink">{product.sku}</p>
          <dl className="flex flex-col gap-1 text-sm">
            {product.brand ? (
              <div className="flex gap-2">
                <dt className="text-ink-muted">Marca</dt>
                <dd className="text-ink">{product.brand}</dd>
              </div>
            ) : null}
            {category.data ? (
              <div className="flex gap-2">
                <dt className="text-ink-muted">Categoría</dt>
                <dd className="text-ink">{category.data.name}</dd>
              </div>
            ) : null}
          </dl>
          <AvailabilityBadge
            inStock={!!product.in_stock}
            className="self-start"
          />
          <PriceBlock net={product.base_price} vatRate={product.vat_rate} />
          {/* Phase 4: ordering controls go here. */}
        </section>
      </div>

      {product.description ? (
        <section className="flex flex-col gap-2 border-t border-rule pt-6">
          <h2 className="text-xl font-bold text-ink">Descripción</h2>
          <p className="max-w-[65ch] whitespace-pre-line text-ink">
            {product.description}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 border-t border-rule pt-6">
        <h2 className="text-xl font-bold text-ink">Compatibilidad</h2>
        {compat.error ? (
          <FormAlert>No pudimos cargar la compatibilidad.</FormAlert>
        ) : (compat.data ?? []).length === 0 ? (
          <p className="text-ink-muted">
            Este repuesto no tiene compatibilidad cargada.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Motos compatibles</caption>
              <thead className="bg-surface-2 text-ink-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Marca
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Modelo
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Años
                  </th>
                </tr>
              </thead>
              <tbody>
                {(compat.data ?? []).map((row, i) => (
                  <tr key={i} className="border-t border-rule">
                    <td className="px-3 py-2 text-ink">{row.moto_brand}</td>
                    <td className="px-3 py-2 text-ink">{row.moto_model}</td>
                    <td className="px-3 py-2 text-ink tabular-nums">
                      {years(row.year_from, row.year_to)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
