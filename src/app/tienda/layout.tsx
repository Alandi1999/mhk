import { BrandHeader } from "@/components/shell/brand-header";
import { requireProfile } from "@/lib/auth/session";
import { getCartLineCount } from "./cart-count";

export default async function ShopLayout({ children }: LayoutProps<"/tienda">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "cliente" });
  const cartLines = await getCartLineCount();

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        homeHref="/tienda"
        navLabel="Tienda"
        nav={[
          { href: "/tienda", label: "Tienda" },
          {
            href: "/tienda/carrito",
            label: "Carrito",
            prefix: true,
            count: cartLines,
            countNoun: ["producto en el carrito", "productos en el carrito"],
          },
          { href: "/tienda/pedidos", label: "Pedidos", prefix: true },
        ]}
        userLabel={session.razon_social ?? session.email}
      />
      {children}
    </div>
  );
}
