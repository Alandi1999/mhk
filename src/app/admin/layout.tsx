import { BrandHeader } from "@/components/shell/brand-header";
import { requireProfile } from "@/lib/auth/session";
import { getPendingClientCount, getPendingOrderCount } from "./pending-count";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "admin" });
  const [pending, pendingOrders] = await Promise.all([
    getPendingClientCount(),
    getPendingOrderCount(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        homeHref="/admin"
        navLabel="Administración"
        nav={[
          { href: "/admin", label: "Panel" },
          { href: "/admin/productos", label: "Productos", prefix: true },
          { href: "/admin/categorias", label: "Categorías", prefix: true },
          { href: "/admin/stock", label: "Stock", prefix: true },
          { href: "/admin/importar", label: "Importar", prefix: true },
          {
            href: "/admin/listas-de-precios",
            label: "Listas de precios",
            prefix: true,
          },
          { href: "/admin/promociones", label: "Promociones", prefix: true },
          { href: "/admin/cupones", label: "Cupones", prefix: true },
          {
            href: "/admin/clientes",
            label: "Clientes",
            prefix: true,
            count: pending,
          },
          {
            href: "/admin/pedidos",
            label: "Pedidos",
            prefix: true,
            count: pendingOrders,
          },
          {
            href: "/admin/configuracion",
            label: "Configuración",
            prefix: true,
          },
        ]}
        userLabel={session.email}
      />
      {children}
    </div>
  );
}
