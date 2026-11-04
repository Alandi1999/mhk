import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

/** Promotion name as icon plus text, never colour alone. */
export function PromoBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-sm bg-warning-tint px-2 py-0.5 text-sm font-semibold text-warning",
        className,
      )}
    >
      <Tag aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 break-words">Promo: {name}</span>
    </span>
  );
}
