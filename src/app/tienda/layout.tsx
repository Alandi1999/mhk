import { BrandHeader } from "@/components/shell/brand-header";
import { requireProfile } from "@/lib/auth/session";

export default async function ShopLayout({ children }: LayoutProps<"/tienda">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "cliente" });

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        homeHref="/tienda"
        navLabel="Tienda"
        nav={[{ href: "/tienda", label: "Tienda", prefix: true }]}
        userLabel={session.razon_social ?? session.email}
      />
      {children}
    </div>
  );
}
