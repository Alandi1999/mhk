import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Clients waiting for approval. One head-only count query, deduped per request. */
export const getPendingClientCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "cliente")
    .eq("status", "pending");
  return count ?? 0;
});

/** Orders waiting for payment confirmation. Head-only count, deduped per request. */
export const getPendingOrderCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
});
