"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { format } from "date-fns";

export type QuickTemplateResult = { error: string } | undefined;

export async function createQuickTemplate(
  _prevState: QuickTemplateResult,
  formData: FormData,
): Promise<QuickTemplateResult> {
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount") ?? NaN);
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const merchant = String(formData.get("merchant") ?? "").trim() || null;

  if (!label) return { error: "Label is required." };
  if (Number.isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const user = await getUser();
  if (!user) return { error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase.from("quick_templates").insert({
    user_id: user.id,
    label,
    amount,
    category_id: categoryId,
    merchant,
  });

  if (error) return { error: error.message };
  revalidatePath("/transactions/new");
}

export async function deleteQuickTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("quick_templates").delete().eq("id", id);
  revalidatePath("/transactions/new");
}

export async function useQuickTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("quick_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) return;

  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: template.amount,
    category_id: template.category_id,
    merchant: template.merchant,
    date: format(new Date(), "yyyy-MM-dd"),
    source: "manual",
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/charts");
}
