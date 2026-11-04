"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  runItemsImport,
  saveItem,
  type ItemFormState,
  type ItemsImportState,
} from "./actions";
import type { ItemsReport } from "./run-import";

const itemInitial: ItemFormState = {};
const importInitial: ItemsImportState = {};

export function ItemForm({ listId }: { listId: string }) {
  const [state, action, pending] = useActionState(saveItem, itemInitial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="list_id" value={listId} />
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        <FormField
          name="sku"
          label="SKU"
          required
          maxLength={40}
          autoComplete="off"
          defaultValue={state.values?.sku ?? ""}
          error={errors.sku}
          className="[&_input]:font-mono [&_input]:uppercase"
        />
        <FormField
          name="price"
          label="Precio neto (ARS, sin IVA)"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={state.values?.price ?? ""}
          error={errors.price}
          hint="Ej: 12.500,50. Si el SKU ya tiene precio en la lista, se actualiza."
          className="[&_input]:tabular-nums"
        />
      </div>
      <FormAlert reserve>{state.error}</FormAlert>
      {state.saved ? (
        <p role="status" className="text-sm font-semibold text-success">
          Precio guardado.
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={pending} className="max-sm:w-full">
          Guardar precio
        </Button>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-2xl font-bold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function Report({ report }: { report: ItemsReport }) {
  const ok = report.errorCount === 0;
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <section
      aria-labelledby="report-title"
      className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4"
    >
      <h3
        id="report-title"
        className="flex items-center gap-2 text-lg font-bold text-ink"
      >
        <Icon
          aria-hidden="true"
          className={`size-5 ${ok ? "text-success" : "text-danger"}`}
        />
        {report.applied ? "Importación terminada" : "Validación terminada"}
      </h3>
      {!report.applied ? (
        <p className="text-sm text-ink-muted">
          Solo validamos: no se guardó nada. Si está bien, tocá Importar.
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Filas leídas" value={report.total} />
        <Stat
          label={report.applied ? "Precios nuevos" : "Se crearían"}
          value={report.created}
        />
        <Stat
          label={report.applied ? "Actualizados" : "Se actualizarían"}
          value={report.updated}
        />
        <Stat label="Filas con error" value={report.errorCount} />
      </dl>
      {report.errorCount > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-ink">
            Errores por fila
            {report.applied ? " (esas filas no se importaron)" : ""}
          </h4>
          <ul className="flex flex-col divide-y divide-rule rounded-md border border-rule">
            {report.errors.map((e, i) => (
              <li
                key={`${e.line}-${i}`}
                className="grid grid-cols-[4.5rem_1fr] gap-3 px-3 py-2 text-sm"
              >
                <span className="font-mono font-semibold text-ink tabular-nums">
                  Fila {e.line}
                </span>
                <span className="break-words text-ink">{e.message}</span>
              </li>
            ))}
          </ul>
          {report.errorCount > report.errors.length ? (
            <p className="text-sm text-ink-muted">
              Se muestran los primeros {report.errors.length} de{" "}
              {report.errorCount} errores.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ItemsImportForm({ listId }: { listId: string }) {
  const [state, action, pending] = useActionState(
    runItemsImport,
    importInitial,
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="list_id" value={listId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="file">Archivo CSV (máx. 2 MB, 5000 filas)</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            aria-describedby="file-hint"
            className="h-auto py-2"
          />
          <p id="file-hint" className="text-sm text-ink-muted">
            Columnas: sku, precio (neto, sin IVA). Si el SKU ya tiene precio en
            la lista se actualiza; un SKU que no existe es un error de esa fila.
          </p>
        </div>
        <FormAlert reserve>{state.error}</FormAlert>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            name="intent"
            value="importar"
            disabled={pending}
            className="max-sm:w-full"
          >
            Importar
          </Button>
          <Button
            type="submit"
            name="intent"
            value="validar"
            variant="outline"
            disabled={pending}
            className="max-sm:w-full"
          >
            Solo validar
          </Button>
        </div>
      </form>
      {pending ? (
        <p role="status" className="text-sm text-ink-muted">
          Procesando el archivo...
        </p>
      ) : null}
      {state.report ? <Report report={state.report} /> : null}
    </div>
  );
}
