import * as React from "react";
import { fieldControlClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Native select styled like Input (keeps platform pickers on mobile). */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldControlClass, "pr-8", className)}
      {...props}
    />
  );
}

export { Select };
