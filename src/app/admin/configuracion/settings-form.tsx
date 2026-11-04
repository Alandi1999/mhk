"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { saveMinOrder, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

export function SettingsForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(saveMinOrder, initialState);

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <FormField
        name="min_order_net"
        label="Monto mínimo por pedido (ARS, sin IVA)"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={state.value ?? current}
        hint="Escribí 0 para no exigir mínimo."
        className="[&_input]:tabular-nums"
      />
      <FormAlert reserve>{state.error}</FormAlert>
      {state.saved ? (
        <p role="status" className="text-sm font-semibold text-success">
          Guardado.
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={pending} className="max-sm:w-full">
          Guardar
        </Button>
      </div>
    </form>
  );
}
