import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Importar | MHK Moto Repuestos" };

const TABS = [
  {
    value: "productos",
    label: "Productos",
    template: "/admin/importar/plantilla-productos.csv",
    hint: "Columnas: sku, nombre, descripcion, marca, categoria, precio_neto, iva, activo. Si el SKU existe se actualiza; si no, se crea. Las categorías nuevas se crean solas. El stock no se toca.",
  },
  {
    value: "stock",
    label: "Stock",
    template: "/admin/importar/plantilla-stock.csv",
    hint: "Columnas: sku, cantidad, motivo, nota. La cantidad es un entero con signo (no puede ser 0). Motivo: compra, ajuste, devolucion o correccion (por defecto ajuste).",
  },
] as const;

export default async function ImportPage({
  searchParams,
}: PageProps<"/admin/importar">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const tab = TABS.find((t) => t.value === params.tipo) ?? TABS[0];

  return (
    <PageContainer
      title="Importar desde CSV"
      description="Cargá productos o movimientos de stock en bloque. Primero podés validar el archivo sin guardar nada."
      width="narrow"
    >
      <nav aria-label="Tipo de importación" className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/importar?tipo=${t.value}`}
            aria-current={t.value === tab.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold",
              t.value === tab.value
                ? "border-ink bg-ink text-ground"
                : "border-rule-strong bg-surface text-ink hover:bg-surface-2",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <p>
        <a
          href={tab.template}
          download
          className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
        >
          Descargar plantilla de {tab.label.toLowerCase()}
        </a>
      </p>

      <ImportForm key={tab.value} kind={tab.value} hint={tab.hint} />
    </PageContainer>
  );
}
