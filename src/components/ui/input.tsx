import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

/** Shared by Input and Select so every field control looks the same. */
export const fieldControlClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted hover:border-ink focus-visible:border-ink disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-muted disabled:hover:border-input aria-invalid:border-danger aria-invalid:hover:border-danger md:h-10 md:text-sm";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldControlClass, className)}
      {...props}
    />
  );
}

export { Input };
