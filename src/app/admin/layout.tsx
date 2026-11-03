import { BrandHeader } from "@/components/shell/brand-header";
import { requireProfile } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "admin" });

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        homeHref="/admin"
        navLabel="Administración"
        nav={[
          { href: "/admin", label: "Panel" },
          { href: "/admin/clientes", label: "Clientes", prefix: true },
        ]}
        userLabel={session.email}
      />
      {children}
    </div>
  );
}
