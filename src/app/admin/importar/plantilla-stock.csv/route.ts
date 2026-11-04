import { requireProfile } from "@/lib/auth/session";

const BODY =
  "sku;cantidad;motivo;nota\r\n" +
  "PAST-001;20;compra;Factura A-0001\r\n" +
  "FILT-010;-2;ajuste;Rotura en depósito\r\n";

export async function GET(): Promise<Response> {
  await requireProfile({ role: "admin" });
  return new Response(`\uFEFF${BODY}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-stock.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
