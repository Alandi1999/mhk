"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CouponFormValues } from "@/lib/promotions/schemas";
import { saveCoupon, type CouponFormState } from "./actions";

const initialState: CouponFormState = {};

export function CouponForm({
  initial,
  id,
  uses = 0,
}: {
  initial: CouponFormValues;
  id?: string;
  uses?: number;
}) {
  const [state, action, pending] = useActionState(saveCoupon, initialState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit keep what the admin typed.
  const v = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
        <FormField
          name="code"
          label="Código"
          required
          maxLength={30}
          autoComplete="off"
          autoCapitalize="characters"
          // Immutable once created; the server ignores it on update.
          readOnly={Boolean(id)}
          defaultValue={id ? initial.code : v.code}
          error={errors.code}
          hint={
            id
              ? "El código no se puede cambiar una vez creado."
              : "Letras, números, guion o guion bajo. Se guarda en mayúsculas."
          }
          className="[&_input]:font-mono [&_input]:uppercase"
        />
        <FormField
          name="discount"
          label="Descuento (%)"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={v.discount}
          error={errors.discount}
          hint="De 0,01 a 100. Se aplica a todo el pedido."
          className="[&_input]:tabular-nums"
        />
      </div>
      {id && uses > 0 ? (
        <p
          role="note"
          className="rounded-md bg-warning-tint px-3 py-2 text-sm font-medium text-warning"
        >
          Este cupón ya se usó {uses} {uses === 1 ? "vez" : "veces"}. Si cambiás
          el porcentaje, los pedidos anteriores conservan el que tenían.
        </p>
      ) : null}
      <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
        <FormField
          name="min_order"
          label="Pedido mínimo neto (opcional)"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={v.min_order}
          error={errors.min_order}
          hint="Importe sin IVA y antes del cupón. Vacío: sin mínimo."
          className="[&_input]:tabular-nums"
        />
        <FormField
          name="max_uses"
          label="Usos máximos (opcional)"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={v.max_uses}
          error={errors.max_uses}
          hint="Cada pedido consume un uso; al cancelarlo se devuelve."
          className="[&_input]:tabular-nums"
        />
        <FormField
          name="starts_at"
          label="Inicio (opcional)"
          type="datetime-local"
          defaultValue={v.starts_at}
          error={errors.starts_at}
          hint="Hora de Buenos Aires. Vacío: empieza ya."
          className="[&_input]:tabular-nums"
        />
        <FormField
          name="ends_at"
          label="Fin (opcional)"
          type="datetime-local"
          defaultValue={v.ends_at}
          error={errors.ends_at}
          hint="Vacío: sin vencimiento. El fin no está incluido."
          className="[&_input]:tabular-nums"
        />
      </div>

      <FormAlert reserve>{state.error}</FormAlert>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={pending} className="max-sm:w-full">
          {id ? "Guardar cambios" : "Crear cupón"}
        </Button>
        <Link
          href="/admin/cupones"
          className={buttonVariants({
            variant: "outline",
            className: "max-sm:w-full",
          })}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
