"use server";

import { requireProfile } from "@/lib/auth/session";
import { MAX_CSV_BYTES } from "@/lib/catalog/csv";
import { createClient } from "@/lib/supabase/server";
import {
  ImportFailure,
  importProducts,
  importStock,
  type ImportReport,
} from "./run-import";

export interface ImportState {
  error?: string;
  report?: ImportReport;
}

export async function runImport(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireProfile({ role: "admin" });

  const kind = formData.get("kind");
  if (kind !== "productos" && kind !== "stock") {
    return { error: "Tipo de importación inválido." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo CSV para subir." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { error: "El archivo supera el máximo de 2 MB." };
  }
  const apply = formData.get("intent") === "importar";

  try {
    const text = await file.text();
    const supabase = await createClient();
    const report =
      kind === "productos"
        ? await importProducts(supabase, text, apply)
        : await importStock(supabase, text, apply);
    return { report };
  } catch (error) {
    if (error instanceof ImportFailure) return { error: error.message };
    return { error: "No se pudo procesar el archivo. Probá de nuevo." };
  }
}
