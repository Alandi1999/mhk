"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { SelectField } from "@/components/promotions/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PromotionFormValues } from "@/lib/promotions/schemas";
import { savePromotion, type PromotionFormState } from "./actions";

const initialState: PromotionFormState = {};

const TARGET_OPTIONS = [
  { value: "all", label: "Todos los productos" },
  { value: "product", label: "Un producto (por SKU)" },
  { value: "category", label: "Una categoría" },
] as const;

function Fields({
  v,
  errors,
  categories,
  priceLists,
}: {
  v: PromotionFormValues;
  errors: Record<string, string>;
  categories: { id: string; name: string }[];
  priceLists: { id: string; name: string }[];
}) {
  const [target, setTarget] = useState(v.target);
  return (
    <>
      <div className="grid gap-x-4 gap-y-1 md:grid-cols-[2fr_1fr_1fr]">
        <FormField
          name="name"
          label="Nombre"
          required
          maxLength={80}
          autoComplete="off"
          defaultValue={v.name}
          error={errors.name}
          hint="Lo ve el cliente como la regla aplicada."
        />
        <FormField
          name="discount"
          label="Descuento (%)"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={v.discount}
          error={errors.discount}
          hint="De 0,01 a 100. Ej: 12,5."
          className="[&_input]:tabular-nums"
        />
        <FormField
          name="min_qty"
          label="Cantidad mínima"
          required
          inputMode="numeric"
          autoComplete="off"
          defaultValue={v.min_qty}
          error={errors.min_qty}
          hint="1 es una promoción común. Desde 2 es un descuento por volumen."
          className="[&_input]:tabular-nums"
        />
      </div>

      <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
        <SelectField
          name="target"
          label="Aplica a"
          // Uncontrolled: React resets the form after an action, and a
          // controlled select would fall back to its first option.
          defaultValue={v.target}
          onChange={(e) => setTarget(e.target.value)}
          options={TARGET_OPTIONS}
          error={errors.target}
        />
        <SelectField
          name="price_list_id"
          label="Para"
          defaultValue={v.price_list_id}
          error={errors.price_list_id}
          options={[
            { value: "", label: "Todos los clientes" },
            ...priceLists.map((l) => ({
              value: l.id,
              label: `Solo la lista ${l.name}`,
            })),
          ]}
        />
      </div>
      {target === "product" ? (
        <FormField
          name="sku"
          label="SKU del producto"
          required
          autoComplete="off"
          autoCapitalize="characters"
          defaultValue={v.sku}
          error={errors.sku}
          className="md:max-w-sm [&_input]:font-mono"
        />
      ) : null}
      {target === "category" ? (
        <SelectField
          name="category_id"
          label="Categoría"
          defaultValue={v.category_id}
          error={errors.category_id}
          className="md:max-w-sm"
          options={[
            { value: "", label: "Elegí una categoría" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      ) : null}

      <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
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
    </>
  );
}

export function PromotionForm({
  initial,
  id,
  categories,
  priceLists,
}: {
  initial: PromotionFormValues;
  id?: string;
  categories: { id: string; name: string }[];
  priceLists: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(savePromotion, initialState);
  // After a failed submit keep what the admin typed.
  const v = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {/* Remount after each result: React resets a form once its action ends,
          and a select would fall back to its first option. */}
      <Fields
        key={JSON.stringify(state)}
        v={v}
        errors={state.fieldErrors ?? {}}
        categories={categories}
        priceLists={priceLists}
      />
      <FormAlert reserve>{state.error}</FormAlert>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={pending} className="max-sm:w-full">
          {id ? "Guardar cambios" : "Crear promoción"}
        </Button>
        <Link
          href="/admin/promociones"
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
