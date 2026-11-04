export type RuleWindow = {
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type PromotionState = "inactive" | "scheduled" | "running" | "expired";
export type CouponState = PromotionState | "exhausted";

/**
 * Mirrors the SQL rules in price_breakdown / price_cart: the start is
 * inclusive (starts_at <= now) and the end is exclusive (ends_at > now).
 */
export function promotionState(rule: RuleWindow, now: Date): PromotionState {
  if (!rule.active) return "inactive";
  const t = now.getTime();
  if (rule.starts_at && new Date(rule.starts_at).getTime() > t) {
    return "scheduled";
  }
  if (rule.ends_at && new Date(rule.ends_at).getTime() <= t) return "expired";
  return "running";
}

/** Same as promotionState, plus "exhausted" once uses reach max_uses. */
export function couponState(
  coupon: RuleWindow & { uses: number; max_uses: number | null },
  now: Date,
): CouponState {
  const state = promotionState(coupon, now);
  if (
    state === "running" &&
    coupon.max_uses !== null &&
    coupon.uses >= coupon.max_uses
  ) {
    return "exhausted";
  }
  return state;
}

const PROMOTION_LABELS: Record<PromotionState, string> = {
  inactive: "Inactiva",
  scheduled: "Programada",
  running: "Vigente",
  expired: "Vencida",
};

const COUPON_LABELS: Record<CouponState, string> = {
  inactive: "Inactivo",
  scheduled: "Programado",
  running: "Vigente",
  expired: "Vencido",
  exhausted: "Agotado",
};

export function promotionStateLabel(state: PromotionState): string {
  return PROMOTION_LABELS[state];
}

export function couponStateLabel(state: CouponState): string {
  return COUPON_LABELS[state];
}
