"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export type CatBudgetResult = { error: string } | undefined;

export async function saveCategoryBudget(
  _prevState: CatBudgetResult,
  formData: FormData,
): Promise<CatBudgetResult> {
  const categoryId = String(formData.get("category_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const amount = Number(formData.get("amount") ?? NaN);

  if (!categoryId || !month || Number.isNaN(amount) || amount < 0) {
    return { error: "Enter a valid amount." };
  }

  const user = await getUser();
  if (!user) return { error: "Not signed in." };

  const supabase = await createClient();
  if (amount === 0) {
    await supabase
      .from("category_budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .eq("month", month);
  } else {
    const { error } = await supabase.from("category_budgets").upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        month,
        amount,
      },
      { onConflict: "user_id,category_id,month" },
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
