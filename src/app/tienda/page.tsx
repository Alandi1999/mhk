import { LogoutButton } from "@/components/auth/logout-button";
import { requireProfile } from "@/lib/auth/session";

export default async function ShopPage() {
  const session = await requireProfile({ role: "cliente" });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Tienda</h1>
      <p>
        Hola, {session.razon_social ?? session.email}. El catálogo estará
        disponible próximamente.
      </p>
      <LogoutButton />
    </main>
  );
}
