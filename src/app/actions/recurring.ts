"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { currentMonthKey } from "@/lib/month";
import { format, startOfMonth, endOfMonth } from "date-fns";

export type RecurringFormResult = { error: string } | undefined;

export async function createRecurring(
  _prevState: RecurringFormResult,
  formData: FormData,
): Promise<RecurringFormResult> {
  const amount = Number(formData.get("amount") ?? NaN);
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const dayOfMonth = Number(formData.get("day_of_month") ?? 1);

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (dayOfMonth < 1 || dayOfMonth > 28) {
    return { error: "Day must be between 1 and 28." };
  }

  const user = await getUser();
  if (!user) return { error: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_templates").insert({
    user_id: user.id,
    amount,
    category_id: categoryId,
    merchant,
    note,
    day_of_month: dayOfMonth,
  });

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function deleteRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("recurring_templates").delete().eq("id", id);
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function toggleRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("recurring_templates")
    .update({ is_active: !isActive })
    .eq("id", id);
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function applyRecurringForMonth(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();

  const month = currentMonthKey();
  const rangeStart = format(startOfMonth(new Date(month)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(new Date(month)), "yyyy-MM-dd");

  const { data: templates } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("is_active", true);

  if (!templates || templates.length === 0) return;

  const { data: existing } = await supabase
    .from("transactions")
    .select("merchant, amount, category_id")
    .eq("source", "manual")
    .gte("date", rangeStart)
    .lte("date", rangeEnd);

  const existingSet = new Set(
    (existing ?? []).map((t) => `${t.merchant}|${t.amount}|${t.category_id}`),
  );

  const toInsert = templates
    .filter((t) => !existingSet.has(`${t.merchant}|${t.amount}|${t.category_id}`))
    .map((t) => {
      const day = String(t.day_of_month).padStart(2, "0");
      const dateStr = `${month.slice(0, 7)}-${day}`;
      return {
        user_id: user.id,
        amount: t.amount,
        category_id: t.category_id,
        merchant: t.merchant,
        note: t.note,
        date: dateStr,
        source: "manual" as const,
      };
    });

  if (toInsert.length === 0) return;

  await supabase.from("transactions").insert(toInsert);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/charts");
}
