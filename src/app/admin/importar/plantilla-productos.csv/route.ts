import { requireProfile } from "@/lib/auth/session";

const BODY =
  "sku;nombre;descripcion;marca;categoria;precio_neto;iva;activo\r\n" +
  "PAST-001;Pastillas de freno delanteras;Para uso urbano;Brembo;Frenos;12500,50;21;si\r\n" +
  "FILT-010;Filtro de aceite;;Hiflo;Filtros;3200;10,5;si\r\n";

export async function GET(): Promise<Response> {
  await requireProfile({ role: "admin" });
  return new Response(`\uFEFF${BODY}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-productos.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
