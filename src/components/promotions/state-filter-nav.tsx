import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tabs that filter a rule list by state through the `estado` query param. */
export function StateFilterNav({
  basePath,
  filters,
  current,
}: {
  basePath: string;
  filters: readonly { value: string; label: string }[];
  current: string;
}) {
  return (
    <nav aria-label="Filtrar por estado" className="overflow-x-auto">
      <ul className="flex gap-1 border-b border-rule">
        {filters.map((f) => {
          const active = f.value === current;
          return (
            <li key={f.value}>
              <Link
                href={`${basePath}?estado=${f.value}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1 bottom-0 h-1 bg-brand-orange slant-bar"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
