"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FieldError, FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MANUAL_REASONS, NOTE_MAX, reasonLabel } from "@/lib/catalog/stock";
import { recordMovement, type MovementFormState } from "../actions";

const initialState: MovementFormState = {};

export function MovementForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(recordMovement, initialState);
  const errors = state.fieldErrors ?? {};
  const v = state.values ?? { reason: "purchase", quantity: "", note: "" };

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Tipo de movimiento</Label>
          <Select
            id="reason"
            name="reason"
            defaultValue={v.reason}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby="reason-error"
          >
            {MANUAL_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reasonLabel(reason)}
              </option>
            ))}
          </Select>
          <FieldError id="reason-error" error={errors.reason} />
        </div>
        <FormField
          name="quantity"
          label="Cantidad"
          required
          inputMode="numeric"
          autoComplete="off"
          defaultValue={v.quantity}
          error={errors.quantity}
          hint="Número entero. Con signo negativo resta stock (solo ajuste y corrección)."
          className="[&_input]:tabular-nums"
        />
        <FormField
          name="note"
          label="Nota (opcional)"
          maxLength={NOTE_MAX}
          autoComplete="off"
          defaultValue={v.note}
          error={errors.note}
          hint="Ej: número de factura o motivo del ajuste."
          className="sm:col-span-2"
        />
      </div>
      <p className="text-sm text-ink-muted">
        Ingreso por compra y devolución solo suman. Ajuste y corrección aceptan
        cantidades positivas o negativas.
      </p>
      <FormAlert reserve>{state.error}</FormAlert>
      <div>
        <Button type="submit" loading={pending} className="max-sm:w-full">
          Registrar movimiento
        </Button>
      </div>
    </form>
  );
}
