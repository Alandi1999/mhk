import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { AccountStatus } from "@/lib/auth/access";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<AccountStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_STYLES = {
  pending: { icon: Clock, tone: "bg-warning-tint text-warning" },
  approved: { icon: CircleCheck, tone: "bg-success-tint text-success" },
  rejected: { icon: CircleX, tone: "bg-danger-tint text-danger-strong" },
} as const;

/** Account status as text plus an icon shape, never colour alone. */
export function StatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const { icon: Icon, tone } = STATUS_STYLES[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
