import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <p>
        Gestioná las altas de clientes en{" "}
        <Link href="/admin/clientes?estado=pending">Clientes</Link>.
      </p>
    </main>
  );
}
