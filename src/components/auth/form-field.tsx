import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id" | "name"> {
  name: string;
  label: string;
  error?: string;
  hint?: string;
}

/** Label + input + accessible error/hint wiring. */
export function FormField({
  name,
  label,
  error,
  hint,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <p
        id={errorId}
        className="min-h-0 text-sm text-destructive"
        aria-live="polite"
      >
        {error}
      </p>
    </div>
  );
}
