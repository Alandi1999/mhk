import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import type { AccountStatus } from "@/lib/auth/access";
import { TAX_CONDITION_LABELS } from "@/lib/auth/schemas";
import { formatCuit } from "@/lib/cuit";
import { formatWait } from "@/lib/format/relative-wait";
import type { Database } from "@/lib/supabase/database.types";
import { approveClient, rejectClient } from "./actions";

export type ClientRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "razon_social"
  | "cuit"
  | "tax_condition"
  | "phone"
  | "status"
  | "created_at"
>;

const dash = "-";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function RowActions({
  client,
  adminId,
  estado,
}: {
  client: ClientRow;
  adminId: string;
  estado: string;
}) {
  const isSelf = client.id === adminId;
  return (
    <div className="flex gap-4 lg:justify-end lg:gap-3">
      {client.status !== "approved" && !isSelf ? (
        <form action={approveClient} className="max-lg:flex-1">
          <input type="hidden" name="id" value={client.id} />
          <input type="hidden" name="estado" value={estado} />
          <Button type="submit" size="sm" className="max-lg:w-full">
            Aprobar
          </Button>
        </form>
      ) : null}
      {client.status !== "rejected" && !isSelf ? (
        <form action={rejectClient} className="max-lg:flex-1">
          <input type="hidden" name="id" value={client.id} />
          <input type="hidden" name="estado" value={estado} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="max-lg:w-full"
          >
            Rechazar
          </Button>
        </form>
      ) : null}
    </div>
  );
}

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

/**
 * Dense table from the lg breakpoint, stacked rows below it. Both render the
 * same data and actions; the hidden one is display:none, so it is not
 * reachable by keyboard or assistive tech.
 */
export function ClientList({
  clients,
  caption,
  adminId,
  estado,
  now,
}: {
  clients: ClientRow[];
  caption: string;
  adminId: string;
  estado: AccountStatus;
  /** Reference time for the "Esperando" column; computed on the server. */
  now: Date;
}) {
  const pendingView = estado === "pending";
  return (
    <>
      <div className="hidden rounded-lg border border-rule bg-surface lg:block">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} rounded-tl-lg`}>
                Razón social
              </th>
              <th scope="col" className={th}>
                CUIT
              </th>
              <th scope="col" className={th}>
                Condición IVA
              </th>
              <th scope="col" className={th}>
                Teléfono
              </th>
              <th scope="col" className={th}>
                Alta
              </th>
              <th scope="col" className={th}>
                {pendingView ? "Esperando" : "Estado"}
              </th>
              <th scope="col" className={`${th} rounded-tr-lg text-right`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className={`${td} font-semibold text-ink`}>
                  {c.razon_social ?? dash}
                </td>
                <td className={`${td} font-mono whitespace-nowrap`}>
                  {c.cuit ? formatCuit(c.cuit) : dash}
                </td>
                <td className={td}>
                  {c.tax_condition
                    ? TAX_CONDITION_LABELS[c.tax_condition]
                    : dash}
                </td>
                <td className={`${td} whitespace-nowrap`}>{c.phone ?? dash}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <time dateTime={c.created_at}>
                    {formatDate(c.created_at)}
                  </time>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {pendingView ? (
                    formatWait(c.created_at, now)
                  ) : (
                    <StatusBadge status={c.status} />
                  )}
                </td>
                <td className={td}>
                  <RowActions client={c} adminId={adminId} estado={estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {clients.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink">{c.razon_social ?? dash}</p>
              {pendingView ? (
                <span className="text-sm whitespace-nowrap text-ink-muted">
                  {formatWait(c.created_at, now)}
                </span>
              ) : (
                <StatusBadge status={c.status} />
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-muted">CUIT</dt>
              <dd className="font-mono">
                {c.cuit ? formatCuit(c.cuit) : dash}
              </dd>
              <dt className="text-ink-muted">Condición IVA</dt>
              <dd>
                {c.tax_condition ? TAX_CONDITION_LABELS[c.tax_condition] : dash}
              </dd>
              <dt className="text-ink-muted">Teléfono</dt>
              <dd>{c.phone ?? dash}</dd>
              <dt className="text-ink-muted">Alta</dt>
              <dd>
                <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
              </dd>
            </dl>
            <RowActions client={c} adminId={adminId} estado={estado} />
          </li>
        ))}
      </ul>
    </>
  );
}
