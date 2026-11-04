"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runImport, type ImportState } from "./actions";
import type { ImportReport } from "./run-import";

const initialState: ImportState = {};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-2xl font-bold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function Report({ report }: { report: ImportReport }) {
  const stats =
    report.kind === "productos"
      ? [
          {
            label: report.applied ? "Creados" : "Se crearían",
            value: report.created,
          },
          {
            label: report.applied ? "Actualizados" : "Se actualizarían",
            value: report.updated,
          },
          {
            label: report.applied ? "Categorías creadas" : "Categorías nuevas",
            value: report.newCategories,
          },
        ]
      : [
          {
            label: report.applied
              ? "Movimientos registrados"
              : "Movimientos válidos",
            value: report.movements,
          },
        ];
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
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
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

export function ImportForm({
  kind,
  hint,
}: {
  kind: "productos" | "stock";
  hint: string;
}) {
  const [state, action, pending] = useActionState(runImport, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="kind" value={kind} />
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
            {hint}
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
