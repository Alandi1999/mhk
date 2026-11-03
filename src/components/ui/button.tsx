import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Orange fill, black label (7.65:1).
        default:
          "bg-brand-orange text-ink-on-brand hover:bg-brand-orange-strong active:bg-brand-orange-strong",
        outline:
          "border-rule-strong bg-surface text-ink hover:bg-surface-2 active:bg-surface-2",
        secondary: "bg-surface-2 text-ink hover:bg-rule active:bg-rule",
        ghost: "text-ink hover:bg-surface-2 active:bg-surface-2",
        // For use inside black bands.
        inverse:
          "border-rule-on-band bg-transparent text-ink-on-band hover:bg-white/10 active:bg-white/15",
        destructive:
          "bg-danger-tint text-danger-strong hover:bg-[color-mix(in_oklch,var(--danger-tint),var(--danger)_12%)]",
      },
      // 44px touch targets on small screens, denser from md.
      size: {
        default: "h-11 px-4 md:h-10",
        sm: "h-11 px-3 md:h-8",
        lg: "h-12 px-6 text-base",
        icon: "size-11 md:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
