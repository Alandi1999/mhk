import {
  CircleCheck,
  CircleX,
  Clock,
  PackageCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { STATUS_LABELS, type OrderStatus } from "@/lib/orders/orders";
import { cn } from "@/lib/utils";

const STYLES = {
  pending: { icon: Clock, tone: "bg-warning-tint text-warning" },
  confirmed: { icon: CircleCheck, tone: "bg-success-tint text-success" },
  preparing: { icon: Wrench, tone: "bg-surface-2 text-ink" },
  shipped: { icon: Truck, tone: "bg-surface-2 text-ink" },
  delivered: { icon: PackageCheck, tone: "bg-success-tint text-success" },
  cancelled: { icon: CircleX, tone: "bg-danger-tint text-danger-strong" },
} as const;

/** Order status as text plus an icon shape, never colour alone. */
export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { icon: Icon, tone } = STYLES[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-sm font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {STATUS_LABELS[status]}
    </span>
  );
}
