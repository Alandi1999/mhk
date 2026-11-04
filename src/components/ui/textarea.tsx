import * as React from "react";
import { cn } from "@/lib/utils";

/** Multi-line field; shares the Input look but grows with its rows. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full min-w-0 rounded-md border border-input bg-surface px-3 py-2 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted hover:border-ink focus-visible:border-ink disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-muted aria-invalid:border-danger md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
