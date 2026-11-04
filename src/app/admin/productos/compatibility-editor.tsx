"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCompatibility, type CompatibilityState } from "./actions";

export function CompatibilityEditor({
  productId,
  initialText,
}: {
  productId: string;
  initialText: string;
}) {
  const [state, action, pending] = useActionState<CompatibilityState, FormData>(
    saveCompatibility,
    {},
  );
  const lineErrors = state.lineErrors ?? [];

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="product_id" value={productId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="compatibility">Motos compatibles</Label>
        <Textarea
          id="compatibility"
          name="compatibility"
          rows={8}
          spellCheck={false}
          defaultValue={state.text ?? initialText}
          aria-invalid={lineErrors.length > 0 ? true : undefined}
          aria-describedby="compatibility-hint"
          placeholder={"Honda | Wave 110 | 2015-2022\nYamaha | YBR 125"}
          className="font-mono"
        />
        <p id="compatibility-hint" className="text-sm text-ink-muted">
          Una moto por línea: Marca | Modelo | Años. Los años son opcionales
          (2018, 2015-2022). Al guardar se reemplaza toda la lista.
        </p>
      </div>

      {lineErrors.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-md bg-danger-tint px-3 py-2.5 text-sm font-medium text-danger-strong">
          {lineErrors.map((e) => (
            <li key={`${e.line}-${e.message}`}>
              Línea {e.line}: {e.message}
            </li>
          ))}
        </ul>
      ) : null}
      <FormAlert>{state.error}</FormAlert>
      {state.saved ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm font-semibold text-success"
        >
          <CircleCheck aria-hidden="true" className="size-4" />
          Compatibilidad guardada.
        </p>
      ) : null}

      <div>
        <Button type="submit" loading={pending} className="max-sm:w-full">
          Guardar compatibilidad
        </Button>
      </div>
    </form>
  );
}
