import type { ComponentProps } from "react";
import { FieldError } from "@/components/auth/form-field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectFieldProps extends Omit<
  ComponentProps<"select">,
  "id" | "name"
> {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
}

/** Label + native select + accessible error/hint wiring (like FormField). */
export function SelectField({
  name,
  label,
  error,
  hint,
  options,
  className,
  ...props
}: SelectFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [hint ? hintId : null, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Select
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} error={error} />
    </div>
  );
}
