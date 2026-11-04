import { requireProfile } from "@/lib/auth/session";

const BODY = "sku;precio\r\nMOT-BUJ-CR7;2800,00\r\nTRA-KIT-428;38000\r\n";

export async function GET(): Promise<Response> {
  await requireProfile({ role: "admin" });
  return new Response(`﻿${BODY}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-precios.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
