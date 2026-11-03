import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireProfile } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth: the proxy already filters, the server re-checks.
  const session = await requireProfile({ role: "admin" });

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <nav aria-label="Administración" className="flex gap-4">
          <Link href="/admin">Panel</Link>
          <Link href="/admin/clientes">Clientes</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm">{session.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
