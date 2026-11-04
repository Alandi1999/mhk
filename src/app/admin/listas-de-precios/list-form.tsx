"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { saveList, type ListFormState } from "./actions";

const initialState: ListFormState = {};

export function ListForm({
  initial,
}: {
  initial: { id?: string; name: string; discount: string };
}) {
  const [state, action, pending] = useActionState(saveList, initialState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit keep what the admin typed.
  const v = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[2fr_1fr]">
        <FormField
          name="name"
          label="Nombre de la lista"
          required
          maxLength={80}
          autoComplete="off"
          defaultValue={v.name}
          error={errors.name}
        />
        <FormField
          name="discount"
          label="Descuento sobre el precio base (%)"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={v.discount}
          error={errors.discount}
          hint="Ej: 12,5. Los precios puntuales mandan sobre este descuento."
          className="[&_input]:tabular-nums"
        />
      </div>
      <FormAlert reserve>{state.error}</FormAlert>
      <div>
        <Button type="submit" loading={pending} className="max-sm:w-full">
          {initial.id ? "Guardar cambios" : "Crear lista"}
        </Button>
      </div>
    </form>
  );
}
