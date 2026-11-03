"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { register, type FormState } from "@/lib/auth/actions";
import { TAX_CONDITION_LABELS, TAX_CONDITIONS } from "@/lib/auth/schemas";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initialState);

  if (state.registered) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Cuenta pendiente de aprobación
        </h2>
        <p>
          Recibimos tu solicitud. Si te pedimos confirmar el email, revisá tu
          bandeja de entrada. Te vamos a habilitar el acceso una vez que
          validemos tus datos.
        </p>
        <Link href="/login">Ir a ingresar</Link>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div
        role="alert"
        aria-live="assertive"
        className="text-sm text-destructive"
      >
        {state.error}
      </div>
      <FormField
        name="razon_social"
        label="Razón social"
        autoComplete="organization"
        required
        error={errors.razon_social}
      />
      <FormField
        name="cuit"
        label="CUIT"
        inputMode="numeric"
        autoComplete="off"
        required
        hint="Con o sin guiones. Ej: 30-71234567-1"
        error={errors.cuit}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tax_condition">Condición frente al IVA</Label>
        <select
          id="tax_condition"
          name="tax_condition"
          required
          defaultValue=""
          aria-invalid={errors.tax_condition ? true : undefined}
          aria-describedby="tax_condition-error"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {TAX_CONDITIONS.map((value) => (
            <option key={value} value={value}>
              {TAX_CONDITION_LABELS[value]}
            </option>
          ))}
        </select>
        <p
          id="tax_condition-error"
          className="text-sm text-destructive"
          aria-live="polite"
        >
          {errors.tax_condition}
        </p>
      </div>
      <FormField
        name="phone"
        type="tel"
        label="Teléfono"
        autoComplete="tel"
        required
        error={errors.phone}
      />
      <FormField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
      />
      <FormField
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo 8 caracteres"
        error={errors.password}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Crear cuenta"}
      </Button>
      <p className="text-sm">
        ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
      </p>
    </form>
  );
}
