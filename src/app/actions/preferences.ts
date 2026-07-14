"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { type CurrencyCode, CURRENCIES } from "@/lib/currency";

export type PrefsResult = { error: string } | undefined;

export async function saveCurrency(
  _prevState: PrefsResult,
  formData: FormData,
): Promise<PrefsResult> {
  const currency = String(formData.get("currency") ?? "");

  if (!(currency in CURRENCIES)) {
    return { error: "Invalid currency." };
  }

  const user = await getUser();
  if (!user) return { error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase.from("user_preferences").upsert(
    { user_id: user.id, currency: currency as CurrencyCode },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
}
