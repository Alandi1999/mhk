import type { Metadata } from "next";
import { FormAlert } from "@/components/auth/form-alert";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory, renameCategory } from "./actions";

export const metadata: Metadata = { title: "Categorías | MHK Moto Repuestos" };

const ACTION_ERRORS: Record<string, string> = {
  "en-uso":
    "No se puede eliminar: hay productos en esta categoría. Movelos a otra categoría primero.",
  duplicada: "Ya existe una categoría con ese nombre.",
  invalido: "El nombre es obligatorio y admite hasta 80 caracteres.",
  "no-guardado":
    "No se pudo guardar el cambio. Puede que no tengas permiso o que la categoría ya no exista.",
};

export default async function CategoriesPage({
  searchParams,
}: PageProps<"/admin/categorias">) {
  await requireProfile({ role: "admin" });
  const params = await searchParams;
  const actionError = typeof params.error === "string" ? params.error : null;

  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <PageContainer
      title="Categorías"
      description="Agrupan los productos del catálogo. Una categoría con productos no se puede eliminar."
      width="narrow"
    >
      <FormAlert>
        {actionError
          ? (ACTION_ERRORS[actionError] ??
            "No se pudo completar la acción. Probá de nuevo.")
          : null}
      </FormAlert>

      <form
        action={createCategory}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="new-name">Nueva categoría</Label>
          <Input id="new-name" name="name" required maxLength={80} />
        </div>
        <Button type="submit">Crear categoría</Button>
      </form>

      {error ? (
        <FormAlert>No pudimos cargar las categorías. Probá de nuevo.</FormAlert>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-ink-muted">
          Todavía no hay categorías.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-surface">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <form
                action={renameCategory}
                className="flex flex-1 flex-col gap-3 sm:flex-row"
              >
                <input type="hidden" name="id" value={c.id} />
                <Input
                  name="name"
                  defaultValue={c.name}
                  required
                  maxLength={80}
                  aria-label={`Nombre de la categoría ${c.name}`}
                />
                <Button type="submit" variant="outline">
                  Renombrar
                </Button>
              </form>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  className="max-sm:w-full"
                >
                  Eliminar
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
