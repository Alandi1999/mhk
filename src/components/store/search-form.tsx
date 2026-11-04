import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/** Plain GET form: works without JS and keeps the query after submit. */
export function SearchForm({
  q,
  categoria,
  categories,
}: {
  q: string;
  categoria: string;
  categories: { id: string; name: string }[];
}) {
  return (
    <form
      method="get"
      action="/tienda"
      role="search"
      className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="q">Buscar por código, nombre o moto</Label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={100}
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Ej: PAST-001, pastilla, CG 150"
          className="h-12 text-lg md:h-11"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoria">Categoría</Label>
        <Select id="categoria" name="categoria" defaultValue={categoria}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="lg" className="h-12 md:h-11">
        <Search aria-hidden="true" />
        Buscar
      </Button>
    </form>
  );
}
