import { CircleCheck, CircleOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product visibility as text plus an icon shape, never colour alone. */
export function ActiveBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  const Icon = active ? CircleCheck : CircleOff;
  return (
    <span
      data-active={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-sm font-semibold whitespace-nowrap",
        active ? "bg-success-tint text-success" : "bg-surface-2 text-ink-muted",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
