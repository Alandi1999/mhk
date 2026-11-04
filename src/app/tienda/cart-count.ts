import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Lines in the caller's cart. One head-only count query, deduped per request. */
export const getCartLineCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cart_items")
    .select("product_id", { count: "exact", head: true });
  return count ?? 0;
});
