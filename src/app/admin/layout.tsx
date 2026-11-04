import { BrandHeader } from "@/components/shell/brand-header";
import { requireProfile } from "@/lib/auth/session";
import { getPendingClientCount } from "./pending-count";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "admin" });
  const pending = await getPendingClientCount();

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        homeHref="/admin"
        navLabel="Administración"
        nav={[
          { href: "/admin", label: "Panel" },
          { href: "/admin/productos", label: "Productos", prefix: true },
          { href: "/admin/categorias", label: "Categorías", prefix: true },
          {
            href: "/admin/clientes",
            label: "Clientes",
            prefix: true,
            count: pending,
          },
        ]}
        userLabel={session.email}
      />
      {children}
    </div>
  );
}
