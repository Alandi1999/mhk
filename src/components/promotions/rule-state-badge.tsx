import {
  Ban,
  CalendarX,
  CircleCheck,
  CircleOff,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  couponStateLabel,
  promotionStateLabel,
  type CouponState,
} from "@/lib/promotions/state";
import { cn } from "@/lib/utils";

const STYLES: Record<CouponState, { icon: LucideIcon; tone: string }> = {
  running: { icon: CircleCheck, tone: "bg-success-tint text-success" },
  scheduled: { icon: Clock, tone: "bg-warning-tint text-warning" },
  expired: { icon: CalendarX, tone: "bg-surface-2 text-ink-muted" },
  inactive: { icon: CircleOff, tone: "bg-surface-2 text-ink-muted" },
  exhausted: { icon: Ban, tone: "bg-danger-tint text-danger-strong" },
};

/** Promotion or coupon state as text plus an icon shape, never colour alone. */
export function RuleStateBadge({
  state,
  kind,
  className,
}: {
  state: CouponState;
  kind: "promotion" | "coupon";
  className?: string;
}) {
  const { icon: Icon, tone } = STYLES[state];
  const label =
    kind === "coupon"
      ? couponStateLabel(state)
      : promotionStateLabel(state === "exhausted" ? "inactive" : state);
  return (
    <span
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-sm font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}
