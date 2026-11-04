import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteList } from "./actions";

export type ListRow = {
  id: string;
  name: string;
  discount_pct: number;
  items: number;
  clients: number;
};

const th =
  "sticky top-0 z-10 bg-surface-2 px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
const td = "px-4 py-3 align-middle";

export function formatPct(value: number): string {
  return `${String(value).replace(".", ",")} %`;
}

function RowActions({ list }: { list: ListRow }) {
  return (
    <div className="flex gap-4 lg:justify-end lg:gap-3">
      <Link
        href={`/admin/listas-de-precios/${list.id}`}
        className={buttonVariants({
          size: "sm",
          variant: "outline",
          className: "max-lg:flex-1",
        })}
      >
        Editar
      </Link>
      <form action={deleteList} className="max-lg:flex-1">
        <input type="hidden" name="id" value={list.id} />
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          className="max-lg:w-full"
        >
          Eliminar
        </Button>
      </form>
    </div>
  );
}

/** Dense table from lg, stacked rows below (same pattern as clients). */
export function ListTable({ lists }: { lists: ListRow[] }) {
  return (
    <>
      <div className="hidden rounded-lg border border-rule bg-surface lg:block">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Listas de precios</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} rounded-tl-lg`}>
                Nombre
              </th>
              <th scope="col" className={`${th} text-right`}>
                Descuento
              </th>
              <th scope="col" className={`${th} text-right`}>
                Precios puntuales
              </th>
              <th scope="col" className={`${th} text-right`}>
                Clientes
              </th>
              <th scope="col" className={`${th} rounded-tr-lg text-right`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:hover]:bg-ground [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-rule">
            {lists.map((l) => (
              <tr key={l.id}>
                <td className={`${td} font-semibold text-ink`}>{l.name}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {formatPct(l.discount_pct)}
                </td>
                <td className={`${td} text-right tabular-nums`}>{l.items}</td>
                <td className={`${td} text-right tabular-nums`}>{l.clients}</td>
                <td className={td}>
                  <RowActions list={l} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface lg:hidden">
        {lists.map((l) => (
          <li key={l.id} className="flex flex-col gap-3 p-4">
            <p className="font-semibold break-words text-ink">{l.name}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-muted">Descuento</dt>
              <dd className="tabular-nums">{formatPct(l.discount_pct)}</dd>
              <dt className="text-ink-muted">Precios puntuales</dt>
              <dd className="tabular-nums">{l.items}</dd>
              <dt className="text-ink-muted">Clientes</dt>
              <dd className="tabular-nums">{l.clients}</dd>
            </dl>
            <RowActions list={l} />
          </li>
        ))}
      </ul>
    </>
  );
}
