import { requireProfile } from "@/lib/auth/session";

export default async function ShopLayout({ children }: LayoutProps<"/tienda">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  await requireProfile({ role: "cliente" });
  return children;
}
