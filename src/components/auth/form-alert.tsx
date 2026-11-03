import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Form-level error region. The live region is always mounted so assistive
 * tech announces the message when it appears; it takes no space while empty.
 */
export function FormAlert({
  children,
  reserve = false,
}: {
  children?: ReactNode;
  /**
   * Reserve room for a two-line alert so controls below do not jump when it
   * appears. Use it directly above the submit button.
   */
  reserve?: boolean;
}) {
  const region = (
    <div role="alert" aria-live="assertive">
      {children ? (
        <p className="flex items-start gap-2 rounded-md bg-danger-tint px-3 py-2.5 text-sm font-medium text-danger-strong">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <span>{children}</span>
        </p>
      ) : null}
    </div>
  );
  return reserve ? (
    <div className="flex min-h-15 flex-col justify-end">{region}</div>
  ) : (
    region
  );
}
