"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { login, type FormState } from "@/lib/auth/actions";

const initialState: FormState = {};

export function LoginForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormAlert>{state.error}</FormAlert>
      <FormField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <FormField
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <Button type="submit" size="lg" loading={pending} className="mt-1">
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
      <p className="text-sm text-ink-muted">
        ¿Todavía no tenés cuenta? <Link href="/registro">Registrate</Link>
      </p>
    </form>
  );
}
