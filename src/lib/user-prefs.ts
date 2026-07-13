import { cache } from "react";
import { createClient, getUser } from "@/lib/supabase/server";
import { type CurrencyCode, DEFAULT_CURRENCY } from "@/lib/currency";

export const getUserCurrency = cache(async (): Promise<CurrencyCode> => {
  const user = await getUser();
  if (!user) return DEFAULT_CURRENCY;

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("currency")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.currency as CurrencyCode) || DEFAULT_CURRENCY;
});
