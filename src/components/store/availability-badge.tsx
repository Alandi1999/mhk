import { CircleCheck, CircleOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Availability as icon plus text, never colour alone. No quantities. */
export function AvailabilityBadge({
  inStock,
  className,
}: {
  inStock: boolean;
  className?: string;
}) {
  const Icon = inStock ? CircleCheck : CircleOff;
  return (
    <span
      data-in-stock={inStock}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-sm font-semibold whitespace-nowrap",
        inStock
          ? "bg-success-tint text-success"
          : "bg-surface-2 text-ink-muted",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {inStock ? "Disponible" : "Sin stock"}
    </span>
  );
}
