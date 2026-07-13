import { createClient } from "@/lib/supabase/server";
import { type CurrencyCode, DEFAULT_CURRENCY } from "@/lib/currency";

export async function getUserCurrency(): Promise<CurrencyCode> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return DEFAULT_CURRENCY;

  const { data } = await supabase
    .from("user_preferences")
    .select("currency")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return (data?.currency as CurrencyCode) || DEFAULT_CURRENCY;
}
