import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { buttonVariants } from "@/components/ui/button";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/store/product-card";
import { SearchForm } from "@/components/store/search-form";
import { requireProfile } from "@/lib/auth/session";
import { IMAGE_BUCKET } from "@/lib/catalog/images";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/catalog/product-query";
import { parseSearchQuery } from "@/lib/catalog/search";
import {
  COMPAT_MATCH_LIMIT,
  compatFilter,
  firstImageByProduct,
  mergeExactFirst,
  storeSearchFilters,
} from "@/lib/catalog/store-search";
import { noticeMessage } from "@/lib/cart/cart";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tienda | MHK Moto Repuestos" };

const COLUMNS =
  "id, sku, name, brand, price, list_price, rule_name, vat_rate, in_stock";

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function ShopPage({ searchParams }: PageProps<"/tienda">) {
  const session = await requireProfile({ role: "cliente" });
  const params = await searchParams;
  const q = one(params.q).slice(0, 100);
  const categoria = /^[0-9a-f-]{36}$/i.test(one(params.categoria))
    ? one(params.categoria)
    : "";
  const page = parsePage(params.page);
  const parsed = parseSearchQuery(q);

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  // Compatibility matches: products whose moto brand/model match each term.
  const idsByTerm = await Promise.all(
    parsed.terms.map(async (term) => {
      const { data } = await supabase
        .from("product_compatibility")
        .select("product_id")
        .or(compatFilter(term))
        .limit(COMPAT_MATCH_LIMIT);
      return [...new Set((data ?? []).map((row) => row.product_id))];
    }),
  );

  // An exact part-code match is listed first, ahead of any pagination.
  let exact: {
    id: string;
    sku: string;
    name: string;
    brand: string | null;
    price: number | null;
    list_price: number | null;
    rule_name: string | null;
    vat_rate: number;
    in_stock: boolean | null;
  } | null = null;
  if (parsed.sku && page === 1) {
    let exactQuery = supabase
      .from("catalog_products")
      .select(COLUMNS)
      .eq("sku", parsed.sku);
    if (categoria) exactQuery = exactQuery.eq("category_id", categoria);
    exact = (await exactQuery.maybeSingle()).data;
  }

  let query = supabase
    .from("catalog_products")
    .select(COLUMNS, { count: "exact" });
  for (const filter of storeSearchFilters(q, idsByTerm)) {
    query = query.or(filter);
  }
  if (categoria) query = query.eq("category_id", categoria);
  if (parsed.sku && page > 1) {
    // Page 1 already carries the exact match; keep later pages consistent.
    query = query.neq("sku", parsed.sku);
  } else if (exact) {
    query = query.neq("sku", exact.sku);
  }
  const { from, to } = pageRange(page);
  const { data: rows, count, error } = await query.order("sku").range(from, to);

  // Asking for a page past the end is an empty page, not a failure.
  const outOfRange = error?.code === "PGRST103";
  const listed = mergeExactFirst(exact, rows ?? []);
  const total = (count ?? 0) + (exact ? 1 : 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: images } =
    listed.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, storage_path")
          .in(
            "product_id",
            listed.map((p) => p.id),
          )
          .order("position")
      : { data: [] };
  const imagePaths = firstImageByProduct(images ?? []);
  const products: StoreProduct[] = listed.map((p) => {
    const path = imagePaths.get(p.id);
    return {
      ...p,
      imageUrl: path
        ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
        : null,
    };
  });

  const hrefFor = (target: number) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (categoria) usp.set("categoria", categoria);
    if (target > 1) usp.set("page", String(target));
    const s = usp.toString();
    return `/tienda${s ? `?${s}` : ""}`;
  };
  const filtered = q !== "" || categoria !== "";
  // Where "Agregar" sends the buyer back to: same search, same page.
  const returnTo = hrefFor(page);
  const added = one(params.agregado);
  const cartError = one(params.error);

  return (
    <PageContainer
      title="Catálogo"
      description={`Hola, ${session.razon_social ?? session.email}. Buscá por código de pieza para encontrar rápido lo que necesitás.`}
    >
      <SearchForm q={q} categoria={categoria} categories={categories ?? []} />

      {added ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-success-tint px-3 py-2.5 text-sm font-medium text-success"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Agregaste <span className="font-mono">{added}</span> al carrito.{" "}
            <Link
              href="/tienda/carrito"
              className="font-semibold underline underline-offset-4"
            >
              Ver carrito
            </Link>
          </span>
        </p>
      ) : null}
      {cartError ? <FormAlert>{noticeMessage(cartError)}</FormAlert> : null}

      {error && !outOfRange ? (
        <FormAlert>No pudimos cargar el catálogo. Probá de nuevo.</FormAlert>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-rule bg-surface px-4 py-10">
          <p className="text-ink">
            {page > 1
              ? "No hay resultados en esta página."
              : filtered
                ? "No encontramos repuestos con esa búsqueda. Probá con otro código, nombre o modelo de moto."
                : "Todavía no hay repuestos cargados en el catálogo."}
          </p>
          {page > 1 || filtered ? (
            <Link
              href={page > 1 ? hrefFor(1) : "/tienda"}
              className={buttonVariants({ variant: "outline" })}
            >
              {page > 1 ? "Volver a la primera página" : "Ver todo el catálogo"}
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-ink-muted tabular-nums">
            {total} {total === 1 ? "repuesto" : "repuestos"} · página {page} de{" "}
            {pages}
          </p>
          <ul className="flex flex-col gap-3" aria-label="Repuestos">
            {products.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                returnTo={returnTo}
              />
            ))}
          </ul>
          <nav
            aria-label="Paginación"
            className="flex items-center justify-end gap-2"
          >
            {page > 1 ? (
              <Link
                href={hrefFor(page - 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                Anterior
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={hrefFor(page + 1)}
                className={buttonVariants({ variant: "outline" })}
              >
                Siguiente
              </Link>
            ) : null}
          </nav>
        </>
      )}
    </PageContainer>
  );
}
