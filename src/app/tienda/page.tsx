import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";

export default async function ShopPage() {
  const session = await requireProfile({ role: "cliente" });

  return (
    <PageContainer
      title="Tienda"
      description={`Hola, ${session.razon_social ?? session.email}.`}
    >
      <section
        aria-labelledby="catalogo-titulo"
        className="flex flex-col gap-3 border-t border-rule pt-6"
      >
        <span
          aria-hidden="true"
          className="h-1 w-16 bg-brand-orange slant-bar"
        />
        <h2 id="catalogo-titulo" className="text-lg font-bold text-ink">
          El catálogo estará disponible próximamente
        </h2>
        <p className="max-w-[65ch] text-ink-muted">
          Estamos cargando los repuestos. Cuando esté listo vas a poder
          buscarlos por código y ver tus precios acá mismo.
        </p>
      </section>
    </PageContainer>
  );
}
