"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/session";
import {
  mergeQuantity,
  parseQuantity,
  safeReturnPath,
  withNotice,
} from "@/lib/cart/cart";
import { createClient } from "@/lib/supabase/server";

const CART = "/tienda/carrito";
const idSchema = z.uuid();
const noteSchema = z.string().trim().max(500);

function refresh(): void {
  // The header cart count lives in the shop layout.
  revalidatePath("/tienda", "layout");
}

/** Add to cart from the catalog or a product page; sums with the existing line. */
export async function addToCart(formData: FormData): Promise<void> {
  await requireProfile({ role: "cliente" });
  const back = safeReturnPath(formData.get("return_to"));
  const productId = idSchema.safeParse(formData.get("product_id"));
  const quantity = parseQuantity(formData.get("quantity"));
  if (!productId.success || quantity === null) {
    redirect(withNotice(back, "error", "cantidad"));
  }

  const supabase = await createClient();
  // RLS (cart_own) scopes both queries to the caller's own cart.
  const { data: product } = await supabase
    .from("catalog_products")
    .select("sku, price, in_stock")
    .eq("id", productId.data)
    .maybeSingle();
  if (!product || product.price === null || !product.in_stock) {
    redirect(withNotice(back, "error", "no-disponible"));
  }

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("product_id", productId.data)
    .maybeSingle();
  const { error } = await supabase.from("cart_items").upsert(
    {
      product_id: productId.data,
      quantity: mergeQuantity(existing?.quantity ?? 0, quantity),
    },
    { onConflict: "user_id,product_id" },
  );
  if (error) redirect(withNotice(back, "error", "no-guardado"));

  refresh();
  redirect(withNotice(back, "agregado", product.sku));
}

export async function setCartQuantity(formData: FormData): Promise<void> {
  await requireProfile({ role: "cliente" });
  const productId = idSchema.safeParse(formData.get("product_id"));
  const quantity = parseQuantity(formData.get("quantity"));
  if (!productId.success || quantity === null) {
    redirect(`${CART}?error=cantidad`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("product_id", productId.data)
    .select("product_id");
  if (error || !data || data.length === 0) {
    redirect(`${CART}?error=no-guardado`);
  }

  refresh();
  redirect(CART);
}

export async function removeFromCart(formData: FormData): Promise<void> {
  await requireProfile({ role: "cliente" });
  const productId = idSchema.safeParse(formData.get("product_id"));
  if (!productId.success) redirect(`${CART}?error=invalido`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("product_id", productId.data);
  if (error) redirect(`${CART}?error=no-guardado`);

  refresh();
  redirect(CART);
}

/** Checkout: the whole order is one atomic database function. */
export async function placeOrder(formData: FormData): Promise<void> {
  await requireProfile({ role: "cliente" });
  const note = noteSchema.safeParse(formData.get("note") ?? "");
  if (!note.success) redirect(`${CART}?error=nota`);

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_note: note.data,
  });
  if (error || !orderId) {
    const raw = error?.code ?? "";
    const code = /^[A-Za-z0-9]{5}$/.test(raw) ? raw : "x";
    redirect(`${CART}?error=${code}`);
  }

  refresh();
  revalidatePath("/tienda/pedidos");
  redirect(`/tienda/pedidos/${orderId}?ok=1`);
}
