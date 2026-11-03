"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FieldError, FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { register, type FormState } from "@/lib/auth/actions";
import { TAX_CONDITION_LABELS, TAX_CONDITIONS } from "@/lib/auth/schemas";

const initialState: FormState = {};

function Group({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2">
      <legend className="mb-3 w-full border-b border-rule pb-2 text-sm font-bold text-ink">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initialState);

  if (state.registered) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <CircleCheck aria-hidden="true" className="size-5 text-success" />
          Cuenta pendiente de aprobación
        </h2>
        <p className="max-w-[65ch] text-ink-muted">
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
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert>{state.error}</FormAlert>

      <Group legend="Datos del comercio">
        <FormField
          name="razon_social"
          label="Razón social"
          autoComplete="organization"
          required
          error={errors.razon_social}
          className="sm:col-span-2"
        />
        <FormField
          name="cuit"
          label="CUIT"
          inputMode="numeric"
          autoComplete="off"
          required
          hint="Con o sin guiones. Ej: 30-71234567-1"
          error={errors.cuit}
          className="[&_input]:font-mono"
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tax_condition">Condición frente al IVA</Label>
          <Select
            id="tax_condition"
            name="tax_condition"
            required
            defaultValue=""
            aria-invalid={errors.tax_condition ? true : undefined}
            aria-describedby="tax_condition-error"
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {TAX_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {TAX_CONDITION_LABELS[value]}
              </option>
            ))}
          </Select>
          <FieldError id="tax_condition-error" error={errors.tax_condition} />
        </div>
        <FormField
          name="phone"
          type="tel"
          label="Teléfono"
          autoComplete="tel"
          required
          error={errors.phone}
          className="sm:col-span-2"
        />
      </Group>

      <Group legend="Datos de acceso">
        <FormField
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          error={errors.email}
          className="sm:col-span-2"
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
          className="sm:col-span-2"
        />
      </Group>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" loading={pending}>
          {pending ? "Enviando..." : "Crear cuenta"}
        </Button>
        <p className="text-sm text-ink-muted">
          ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
        </p>
      </div>
    </form>
  );
}
