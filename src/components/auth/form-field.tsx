import { CircleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id" | "name"> {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

/** Message line with an icon, so errors never rely on colour alone. */
export function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    // The live region is always mounted and keeps its height: no layout shift.
    <p
      id={id}
      aria-live="polite"
      className="flex min-h-5 items-start gap-1.5 text-sm leading-5 font-medium text-danger"
    >
      {error ? (
        <>
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </>
      ) : null}
    </p>
  );
}

/** Label + input + accessible error/hint wiring. */
export function FormField({
  name,
  label,
  error,
  hint,
  className,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [hint ? hintId : null, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} error={error} />
    </div>
  );
}
