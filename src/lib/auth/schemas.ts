import { z } from "zod";
import { isValidCuit, normalizeCuit } from "@/lib/cuit";

export const TAX_CONDITIONS = [
  "responsable_inscripto",
  "monotributo",
  "exento",
] as const;

export type TaxCondition = (typeof TAX_CONDITIONS)[number];

export const TAX_CONDITION_LABELS: Record<TaxCondition, string> = {
  responsable_inscripto: "Responsable inscripto",
  monotributo: "Monotributo",
  exento: "Exento",
};

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresá un email válido"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga"),
  razon_social: z
    .string()
    .trim()
    .min(2, "Ingresá la razón social")
    .max(120, "La razón social es demasiado larga"),
  cuit: z
    .string()
    .transform(normalizeCuit)
    .refine(isValidCuit, "El CUIT no es válido (11 dígitos)"),
  tax_condition: z.enum(TAX_CONDITIONS, {
    error: "Elegí una condición frente al IVA",
  }),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\s-]{6,25}$/, "Ingresá un teléfono válido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
