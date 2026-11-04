import { cn } from "@/lib/utils";

/**
 * Pending-work counter. Not an alert: it is plain text with an accessible
 * name ("3 pendientes"), so it is read in context and never announced as an
 * error. Renders nothing for zero.
 */
export function CountBadge({
  count,
  tone = "light",
  showLabel = false,
  noun = ["pendiente", "pendientes"],
  className,
}: {
  count: number;
  tone?: "light" | "band";
  /** Show "3 pendientes" instead of just the number. */
  showLabel?: boolean;
  /** Singular and plural for the accessible name (default: pendiente). */
  noun?: readonly [string, string];
  className?: string;
}) {
  if (count <= 0) return null;
  const name = `${count} ${count === 1 ? noun[0] : noun[1]}`;
  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-sm px-1.5 py-0.5 text-sm leading-none font-bold whitespace-nowrap tabular-nums",
        tone === "band"
          ? "bg-brand-amber text-ink-on-brand"
          : "bg-warning-tint text-warning",
        className,
      )}
    >
      <span aria-hidden="true">{showLabel ? name : count}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
