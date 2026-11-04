import type { Metadata } from "next";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { formatArs } from "@/lib/catalog/money";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Configuración | MHK Moto Repuestos",
};

export default async function SettingsPage() {
  await requireProfile({ role: "admin" });
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("min_order_net")
    .eq("id", true)
    .maybeSingle();

  const min = settings?.min_order_net ?? 0;

  return (
    <PageContainer title="Configuración" width="narrow">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Pedido mínimo</h2>
        {error || !settings ? (
          <FormAlert>
            No pudimos cargar la configuración. Probá de nuevo.
          </FormAlert>
        ) : (
          <>
            <p className="text-base text-ink-muted">
              Valor actual:{" "}
              <strong className="text-2xl text-ink tabular-nums">
                {min > 0 ? formatArs(min) : "Sin mínimo"}
              </strong>
            </p>
            <p className="max-w-[65ch] text-sm text-ink-muted">
              Es el monto neto (sin IVA) que tiene que alcanzar un pedido para
              poder enviarse. Se aplica a todos los clientes y se controla al
              confirmar la compra.
            </p>
            <SettingsForm current={String(min)} />
          </>
        )}
      </section>
    </PageContainer>
  );
}
