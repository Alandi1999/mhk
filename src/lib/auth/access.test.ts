import { describe, expect, it } from "vitest";
import { homeFor, resolveAccess, type AccessInput } from "./access";

const anon: Pick<AccessInput, "user" | "profile"> = {
  user: null,
  profile: null,
};
const as = (
  role: "admin" | "cliente",
  status: "pending" | "approved" | "rejected",
) => ({
  user: { id: "u1" },
  profile: { role, status },
});

const allow = { type: "allow" } as const;
const to = (path: string) => ({ type: "redirect", to: path }) as const;

describe("resolveAccess", () => {
  it.each([
    ["/", anon, allow],
    ["/login", anon, allow],
    ["/registro", anon, allow],
    ["/admin", anon, to("/login?next=%2Fadmin")],
    ["/admin/clientes", anon, to("/login?next=%2Fadmin%2Fclientes")],
    ["/tienda", anon, to("/login?next=%2Ftienda")],
    ["/cuenta/pendiente", anon, to("/login?next=%2Fcuenta%2Fpendiente")],
    // authenticated but profile missing: treated as not approved
    ["/tienda", { user: { id: "u1" }, profile: null }, to("/cuenta/pendiente")],
    ["/", { user: { id: "u1" }, profile: null }, allow],
    // approved admin
    ["/admin", as("admin", "approved"), allow],
    ["/admin/clientes", as("admin", "approved"), allow],
    ["/tienda", as("admin", "approved"), allow],
    ["/login", as("admin", "approved"), to("/admin")],
    ["/registro", as("admin", "approved"), to("/admin")],
    ["/cuenta/pendiente", as("admin", "approved"), to("/admin")],
    ["/", as("admin", "approved"), allow],
    // approved client
    ["/tienda", as("cliente", "approved"), allow],
    ["/tienda/x/y", as("cliente", "approved"), allow],
    ["/admin", as("cliente", "approved"), to("/tienda")],
    ["/admin/clientes", as("cliente", "approved"), to("/tienda")],
    ["/login", as("cliente", "approved"), to("/tienda")],
    ["/registro", as("cliente", "approved"), to("/tienda")],
    ["/cuenta/pendiente", as("cliente", "approved"), to("/tienda")],
    // pending / rejected
    ["/tienda", as("cliente", "pending"), to("/cuenta/pendiente")],
    ["/admin", as("cliente", "pending"), to("/cuenta/pendiente")],
    ["/cuenta/pendiente", as("cliente", "pending"), allow],
    ["/login", as("cliente", "pending"), to("/cuenta/pendiente")],
    ["/registro", as("cliente", "pending"), to("/cuenta/pendiente")],
    ["/", as("cliente", "pending"), allow],
    ["/tienda", as("cliente", "rejected"), to("/cuenta/pendiente")],
    ["/cuenta/pendiente", as("cliente", "rejected"), allow],
    // a non-approved admin gets no admin access
    ["/admin", as("admin", "pending"), to("/cuenta/pendiente")],
    ["/admin", as("admin", "rejected"), to("/cuenta/pendiente")],
    // lookalike paths are not protected prefixes by accident
    ["/administrador", anon, allow],
    ["/tiendas", anon, allow],
    ["/admin/", anon, to("/login?next=%2Fadmin%2F")],
  ])("%s -> %j", (pathname, state, expected) => {
    expect(resolveAccess({ pathname, ...state })).toEqual(expected);
  });
});

describe("homeFor", () => {
  it("maps role to home", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("cliente")).toBe("/tienda");
  });
});
