"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TransactionFormResult = { error: string } | undefined;

export async function updateTransaction(
  _prevState: TransactionFormResult,
  formData: FormData,
): Promise<TransactionFormResult> {
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? NaN);
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");

  if (!id || !date || Number.isNaN(amount) || amount <= 0) {
    return { error: "Please fill in a valid amount and date." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ amount, category_id: categoryId, merchant, note, date })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/charts");
  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("receipt_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("transactions").delete().eq("id", id);

  if (transaction?.receipt_path) {
    await supabase.storage.from("receipts").remove([transaction.receipt_path]);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/charts");
}
