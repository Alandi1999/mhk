import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CountBadge } from "@/components/shell/count-badge";
import { PageContainer } from "@/components/shell/page-container";
import { getPendingClientCount, getPendingOrderCount } from "./pending-count";

const CATALOG_SECTIONS = [
  {
    href: "/admin/productos",
    label: "Productos",
    description: "Alta, precios, compatibilidad y fotos de los repuestos.",
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    description: "Ordená el catálogo en categorías.",
  },
  {
    href: "/admin/stock",
    label: "Stock",
    description:
      "Registrá ingresos, ajustes y devoluciones, y mirá el historial.",
  },
  {
    href: "/admin/importar",
    label: "Importar",
    description: "Cargá productos o stock en bloque desde un archivo CSV.",
  },
  {
    href: "/admin/listas-de-precios",
    label: "Listas de precios",
    description:
      "Descuentos por porcentaje y precios puntuales para cada tipo de cliente.",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    description: "Monto mínimo de compra para los pedidos.",
  },
] as const;

const UPCOMING = ["Pagos y envíos"] as const;

export default async function AdminPage() {
  const [pending, pendingOrders] = await Promise.all([
    getPendingClientCount(),
    getPendingOrderCount(),
  ]);
  return (
    <PageContainer
      title="Panel de administración"
      description="Gestioná las altas de clientes, el catálogo y los pedidos. El resto de las áreas se suma en próximas etapas."
    >
      <ul className="divide-y divide-rule border-y border-rule">
        <li>
          <Link
            href="/admin/clientes?estado=pending"
            className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-2 py-3 hover:bg-surface md:grid-cols-[14rem_1fr_auto]"
          >
            <span className="font-semibold text-ink">Clientes</span>
            <span className="flex items-center justify-end gap-3 md:order-3">
              <CountBadge count={pending} showLabel />
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </span>
            <span className="col-span-2 text-sm text-ink-muted md:order-2 md:col-span-1">
              Aprobá o rechazá las altas de comercios.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/pedidos"
            className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-2 py-3 hover:bg-surface md:grid-cols-[14rem_1fr_auto]"
          >
            <span className="font-semibold text-ink">Pedidos</span>
            <span className="flex items-center justify-end gap-3 md:order-3">
              <CountBadge count={pendingOrders} showLabel />
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </span>
            <span className="col-span-2 text-sm text-ink-muted md:order-2 md:col-span-1">
              Mirá los pedidos, avanzá su estado o cancelalos.
            </span>
          </Link>
        </li>
        {CATALOG_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-2 py-3 hover:bg-surface md:grid-cols-[14rem_1fr_auto]"
            >
              <span className="font-semibold text-ink">{section.label}</span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 md:order-3"
              />
              <span className="col-span-2 text-sm text-ink-muted md:order-2 md:col-span-1">
                {section.description}
              </span>
            </Link>
          </li>
        ))}
        {UPCOMING.map((label) => (
          <li
            key={label}
            className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 px-2 py-3 text-ink-muted md:grid-cols-[14rem_1fr_auto]"
          >
            <span>{label}</span>
            <span className="text-sm md:col-start-3">Próximamente</span>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
