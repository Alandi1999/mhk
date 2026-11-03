import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("loginSchema", () => {
  it("accepts valid credentials and trims/lowercases the email", () => {
    const r = loginSchema.safeParse({ email: " A@B.com ", password: "x" });
    expect(r.success && r.data.email).toBe("a@b.com");
  });

  it("rejects bad email and empty password", () => {
    expect(
      loginSchema.safeParse({ email: "nope", password: "x" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "taller@example.com",
    password: "12345678",
    razon_social: "Taller Perez",
    cuit: "20-12345678-6",
    tax_condition: "monotributo",
    phone: "+54 11 5555-0000",
  };

  it("accepts valid data and normalizes the CUIT", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cuit).toBe("20123456786");
  });

  it.each([
    ["short password", { password: "1234567" }],
    ["invalid email", { email: "x" }],
    ["empty razon social", { razon_social: "  " }],
    ["invalid CUIT check digit", { cuit: "20123456787" }],
    ["CUIT with letters", { cuit: "2012345678a" }],
    ["unknown tax condition", { tax_condition: "otro" }],
    ["empty phone", { phone: "" }],
    ["phone with letters", { phone: "abc" }],
  ])("rejects %s", (_name, patch) => {
    expect(registerSchema.safeParse({ ...valid, ...patch }).success).toBe(
      false,
    );
  });

  it("does not accept role/status keys through", () => {
    const r = registerSchema.safeParse({
      ...valid,
      role: "admin",
      status: "approved",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("role");
      expect(r.data).not.toHaveProperty("status");
    }
  });
});
