import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";

const UPCOMING = [
  "Stock y catálogo",
  "Precios y promociones",
  "Pedidos y pagos",
] as const;

export default function AdminPage() {
  return (
    <PageContainer
      title="Panel de administración"
      description="Gestioná las altas de clientes. El resto de las áreas se suma en próximas etapas."
    >
      <ul className="max-w-3xl divide-y divide-rule border-y border-rule">
        <li>
          <Link
            href="/admin/clientes?estado=pending"
            className="group flex min-h-14 items-center justify-between gap-4 px-1 py-3 hover:bg-surface"
          >
            <span className="flex flex-col">
              <span className="font-semibold text-ink">Clientes</span>
              <span className="text-sm text-ink-muted">
                Aprobá o rechazá las altas de comercios.
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-5 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        </li>
        {UPCOMING.map((label) => (
          <li
            key={label}
            className="flex min-h-14 items-center justify-between gap-4 px-1 py-3 text-ink-muted"
          >
            <span>{label}</span>
            <span className="text-sm">Próximamente</span>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
