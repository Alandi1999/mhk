"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FieldError, FormField } from "@/components/auth/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VAT_RATES } from "@/lib/catalog/money";
import { saveProduct, type ProductFormState } from "./actions";

export type ProductFormInitial = {
  id?: string;
  sku: string;
  name: string;
  description: string;
  brand: string;
  category_id: string;
  price: string;
  vat: string;
  active: boolean;
};

export const EMPTY_PRODUCT: ProductFormInitial = {
  sku: "",
  name: "",
  description: "",
  brand: "",
  category_id: "",
  price: "",
  vat: "21",
  active: true,
};

const initialState: ProductFormState = {};

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormInitial;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveProduct, initialState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit keep what the admin typed.
  const v: ProductFormInitial = state.values
    ? {
        ...initial,
        sku: state.values.sku,
        name: state.values.name,
        description: state.values.description,
        brand: state.values.brand,
        category_id: state.values.category_id,
        price: state.values.price,
        vat: state.values.vat,
        active: state.values.active === "on",
      }
    : initial;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        <FormField
          name="sku"
          label="SKU"
          required
          maxLength={40}
          autoComplete="off"
          defaultValue={v.sku}
          error={errors.sku}
          hint="Código con el que piden el repuesto. Se guarda en mayúsculas."
          className="[&_input]:font-mono [&_input]:uppercase"
        />
        <FormField
          name="brand"
          label="Marca del repuesto"
          maxLength={80}
          defaultValue={v.brand}
          error={errors.brand}
        />
        <FormField
          name="name"
          label="Nombre"
          required
          maxLength={200}
          defaultValue={v.name}
          error={errors.name}
          className="sm:col-span-2"
        />

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={4000}
            defaultValue={v.description}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby="description-error"
          />
          <FieldError id="description-error" error={errors.description} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">Categoría</Label>
          <Select
            id="category_id"
            name="category_id"
            defaultValue={v.category_id}
            aria-invalid={errors.category_id ? true : undefined}
            aria-describedby="category_id-error"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError id="category_id-error" error={errors.category_id} />
        </div>

        <FormField
          name="price"
          label="Precio neto (ARS, sin IVA)"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={v.price}
          error={errors.price}
          hint="Ej: 12.500,50"
          className="[&_input]:tabular-nums"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vat">Alícuota de IVA</Label>
          <Select
            id="vat"
            name="vat"
            defaultValue={v.vat}
            aria-invalid={errors.vat ? true : undefined}
            aria-describedby="vat-error"
          >
            {VAT_RATES.map((rate) => (
              <option key={rate} value={String(rate)}>
                {String(rate).replace(".", ",")} %
              </option>
            ))}
          </Select>
          <FieldError id="vat-error" error={errors.vat} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Estado</span>
          <label className="flex min-h-11 items-center gap-3 text-base text-ink">
            <input
              type="checkbox"
              name="active"
              defaultChecked={v.active}
              className="size-5 accent-brand-orange"
            />
            Activo (visible para clientes)
          </label>
        </div>
      </div>

      <FormAlert reserve>{state.error}</FormAlert>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={pending} className="max-sm:w-full">
          {initial.id ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Link
          href="/admin/productos"
          className={buttonVariants({
            variant: "outline",
            className: "max-sm:w-full",
          })}
        >
          Volver al listado
        </Link>
      </div>
    </form>
  );
}
